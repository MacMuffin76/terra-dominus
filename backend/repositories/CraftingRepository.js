const { Op } = require('sequelize');
const logger = require('../utils/logger');
const models = require('../models');

class CraftingRepository {
  constructor() {
    this.Blueprint = models.BlueprintCrafting;
    this.PlayerBlueprint = models.PlayerBlueprint;
    this.CraftingQueue = models.CraftingQueue;
    this.PlayerCraftingStats = models.PlayerCraftingStats;
    this.User = models.User;
  }

  // ==================== BLUEPRINTS ====================

  /**
   * Get all active blueprints
   */
  async getAllBlueprints(options = {}) {
    const where = { is_active: true };
    
    if (options.category) {
      where.category = options.category;
    }
    if (options.rarity) {
      where.rarity = options.rarity;
    }

    return this.Blueprint.findAll({
      where,
      order: [
        ['rarity', 'ASC'],
        ['crafting_station_level_min', 'ASC'],
        ['name', 'ASC']
      ]
    });
  }

  /**
   * Get blueprint by ID
   */
  async getBlueprintById(blueprintId) {
    return this.Blueprint.findByPk(blueprintId);
  }

  /**
   * Get blueprint by name
   */
  async getBlueprintByName(name) {
    return this.Blueprint.findOne({ where: { name, is_active: true } });
  }

  /**
   * Get blueprints by category
   */
  async getBlueprintsByCategory(category) {
    return this.Blueprint.findAll({
      where: { category, is_active: true },
      order: [['rarity', 'ASC'], ['name', 'ASC']]
    });
  }

  /**
   * Get blueprints by rarity
   */
  async getBlueprintsByRarity(rarity) {
    return this.Blueprint.findAll({
      where: { rarity, is_active: true },
      order: [['crafting_station_level_min', 'ASC'], ['name', 'ASC']]
    });
  }

  // ==================== PLAYER BLUEPRINTS ====================

  /**
   * Get all blueprints discovered by user
   */
  async getUserBlueprints(userId, options = {}) {
    const where = { user_id: userId };

    return this.PlayerBlueprint.findAll({
      where,
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint',
          where: { is_active: true },
          required: true
        }
      ],
      order: options.orderBy || [
        ['discovered_at', 'DESC']
      ]
    });
  }

  /**
   * Check if user has discovered a blueprint
   */
  async hasBlueprint(userId, blueprintId) {
    const count = await this.PlayerBlueprint.count({
      where: { user_id: userId, blueprint_id: blueprintId }
    });
    return count > 0;
  }

  /**
   * Grant blueprint to user (discovery)
   */
  async grantBlueprint(userId, blueprintId, source = 'admin_grant', transaction = null) {
    try {
      // Check if already discovered
      const existing = await this.PlayerBlueprint.findOne({
        where: { user_id: userId, blueprint_id: blueprintId },
        transaction
      });

      if (existing) {
        logger.warn('Blueprint already discovered', { userId, blueprintId });
        return existing;
      }

      const playerBlueprint = await this.PlayerBlueprint.create({
        user_id: userId,
        blueprint_id: blueprintId,
        discovery_source: source,
        discovered_at: new Date()
      }, { transaction });

      logger.info('Blueprint granted to user', { userId, blueprintId, source });
      return playerBlueprint;
    } catch (error) {
      logger.error('Failed to grant blueprint', { error: error.message, userId, blueprintId });
      throw error;
    }
  }

  /**
   * Get user blueprint with details
   */
  async getUserBlueprint(userId, blueprintId, transaction = null) {
    return this.PlayerBlueprint.findOne({
      where: { user_id: userId, blueprint_id: blueprintId },
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint',
          required: true
        }
      ],
      transaction
    });
  }

  /**
   * Increment craft count for user blueprint
   */
  async incrementBlueprintCraftCount(userId, blueprintId, transaction = null) {
    const playerBlueprint = await this.PlayerBlueprint.findOne({
      where: { user_id: userId, blueprint_id: blueprintId },
      transaction
    });

    if (!playerBlueprint) {
      throw new Error('Player does not own this blueprint');
    }

    playerBlueprint.times_crafted += 1;
    await playerBlueprint.save({ transaction });

    return playerBlueprint.times_crafted;
  }

  /**
   * Get blueprints discovery statistics
   */
  async getBlueprintDiscoveryStats(userId) {
    const discovered = await this.PlayerBlueprint.count({
      where: { user_id: userId }
    });

    const total = await this.Blueprint.count({
      where: { is_active: true }
    });

    const byRarity = await this.PlayerBlueprint.findAll({
      where: { user_id: userId },
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint',
          attributes: ['rarity'],
          required: true
        }
      ],
      attributes: [],
      group: ['blueprint.rarity'],
      raw: true
    });

    return {
      discovered,
      total,
      percentage: total > 0 ? Math.round((discovered / total) * 100) : 0,
      byRarity: byRarity.reduce((acc, item) => {
        acc[item['blueprint.rarity']] = item.count;
        return acc;
      }, {})
    };
  }

  // ==================== CRAFTING QUEUE ====================

  /**
   * Create a new craft in queue
   */
  async createCraft(craftData, transaction = null) {
    try {
      const craft = await this.CraftingQueue.create({
        user_id: craftData.userId,
        blueprint_id: craftData.blueprintId,
        quantity_target: craftData.quantity || 1,
        resources_consumed: craftData.resourcesConsumed,
        started_at: new Date(),
        completed_at: craftData.completedAt,
        status: 'in_progress'
      }, { transaction });

      logger.info('Craft created', { 
        craftId: craft.id, 
        userId: craftData.userId, 
        blueprintId: craftData.blueprintId 
      });

      return craft;
    } catch (error) {
      logger.error('Failed to create craft', { error: error.message, craftData });
      throw error;
    }
  }

  /**
   * Get user's crafting queue
   */
  async getUserCrafts(userId, options = {}) {
    const where = { user_id: userId };

    if (options.status) {
      where.status = options.status;
    }

    return this.CraftingQueue.findAll({
      where,
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint',
          attributes: ['id', 'name', 'category', 'rarity', 'outputs', 'icon_url']
        }
      ],
      order: options.orderBy || [
        ['completed_at', 'ASC'],
        ['started_at', 'DESC']
      ],
      limit: options.limit,
      offset: options.offset
    });
  }

  /**
   * Get craft by ID
   */
  async getCraftById(craftId, transaction = null) {
    return this.CraftingQueue.findOne({
      where: { id: craftId },
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint'
        }
      ],
      transaction
    });
  }

  /**
   * Get craft by ID and user (for ownership verification)
   */
  async getCraftByIdAndUser(craftId, userId, transaction = null) {
    return this.CraftingQueue.findOne({
      where: { id: craftId, user_id: userId },
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint'
        }
      ],
      transaction
    });
  }

  /**
   * Update craft status
   */
  async updateCraftStatus(craftId, status, transaction = null) {
    const craft = await this.CraftingQueue.findByPk(craftId, { transaction });
    
    if (!craft) {
      throw new Error('Craft not found');
    }

    craft.status = status;

    if (status === 'completed') {
      craft.completed_at = new Date();
    }

    await craft.save({ transaction });
    return craft;
  }

  /**
   * Complete craft (mark as completed and set output)
   */
  async completeCraft(craftId, outputItems, transaction = null) {
    const craft = await this.CraftingQueue.findByPk(craftId, { transaction });
    
    if (!craft) {
      throw new Error('Craft not found');
    }

    craft.status = 'completed';
    craft.output_items = outputItems;
    craft.completed_at = new Date();

    await craft.save({ transaction });

    logger.info('Craft completed', { craftId, outputItems });
    return craft;
  }

  /**
   * Cancel craft
   */
  async cancelCraft(craftId, transaction = null) {
    const craft = await this.CraftingQueue.findByPk(craftId, { transaction });
    
    if (!craft) {
      throw new Error('Craft not found');
    }

    if (craft.status !== 'in_progress') {
      throw new Error('Can only cancel in-progress crafts');
    }

    craft.status = 'cancelled';
    await craft.save({ transaction });

    logger.info('Craft cancelled', { craftId, userId: craft.user_id });
    return craft;
  }

  /**
   * Mark craft as collected
   */
  async collectCraft(craftId, transaction = null) {
    const craft = await this.CraftingQueue.findByPk(craftId, { transaction });
    
    if (!craft) {
      throw new Error('Craft not found');
    }

    if (craft.status !== 'completed') {
      throw new Error('Can only collect completed crafts');
    }

    craft.status = 'collected';
    craft.collected_at = new Date();
    await craft.save({ transaction });

    logger.info('Craft collected', { craftId, userId: craft.user_id });
    return craft;
  }

  /**
   * Get crafts ready to complete (completed_at <= now)
   */
  async getReadyCrafts() {
    return this.CraftingQueue.findAll({
      where: {
        status: 'in_progress',
        completed_at: { [Op.lte]: new Date() }
      },
      include: [
        {
          model: this.Blueprint,
          as: 'blueprint'
        }
      ],
      order: [['completed_at', 'ASC']]
    });
  }

  /**
   * Count active crafts for user
   */
  async countActiveCrafts(userId) {
    return this.CraftingQueue.count({
      where: {
        user_id: userId,
        status: 'in_progress'
      }
    });
  }

  /**
   * Get crafting statistics
   */
  async getCraftingStats(userId = null) {
    const where = userId ? { user_id: userId } : {};

    const [total, byStatus, byRarity] = await Promise.all([
      this.CraftingQueue.count({ where }),
      
      this.CraftingQueue.findAll({
        where,
        attributes: [
          'status',
          [this.CraftingQueue.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        raw: true
      }),

      this.CraftingQueue.findAll({
        where,
        include: [
          {
            model: this.Blueprint,
            as: 'blueprint',
            attributes: ['rarity']
          }
        ],
        attributes: [
          [this.CraftingQueue.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['blueprint.rarity'],
        raw: true
      })
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byRarity: byRarity.reduce((acc, item) => {
        const rarity = item['blueprint.rarity'];
        acc[rarity] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  // ==================== PLAYER CRAFTING STATS ====================

  /**
   * Get or create user crafting stats
   */
  async getOrCreateCraftingStats(userId, transaction = null) {
    let stats = await this.PlayerCraftingStats.findOne({
      where: { user_id: userId },
      transaction
    });

    if (!stats) {
      stats = await this.PlayerCraftingStats.create({
        user_id: userId,
        crafting_xp: 0,
        crafting_level: 1,
        total_crafts_completed: 0,
        total_crafts_cancelled: 0,
        resources_t1_consumed: {},
        resources_t2_consumed: {}
      }, { transaction });

      logger.info('Created crafting stats for user', { userId });
    }

    return stats;
  }

  /**
   * Get user crafting stats
   */
  async getCraftingStats(userId) {
    return this.PlayerCraftingStats.findOne({
      where: { user_id: userId }
    });
  }

  /**
   * Add XP to user
   */
  async addCraftingXP(userId, xpAmount, transaction = null) {
    const stats = await this.getOrCreateCraftingStats(userId, transaction);
    
    const oldXp = stats.crafting_xp;
    const oldLevel = stats.crafting_level;
    
    stats.crafting_xp += xpAmount;
    
    // Calculate new level
    const levelInfo = this.PlayerCraftingStats.calculateLevel(stats.crafting_xp);
    stats.crafting_level = levelInfo.level;
    
    await stats.save({ transaction });

    const leveledUp = stats.crafting_level > oldLevel;

    logger.info('Added crafting XP', { 
      userId, 
      xpAdded: xpAmount, 
      totalXp: stats.crafting_xp,
      oldLevel,
      newLevel: stats.crafting_level,
      leveledUp
    });

    return {
      xpAdded: xpAmount,
      totalXp: stats.crafting_xp,
      oldLevel,
      newLevel: stats.crafting_level,
      leveledUp,
      levelsGained: stats.crafting_level - oldLevel
    };
  }

  /**
   * Increment craft completed counter
   */
  async incrementCraftsCompleted(userId, transaction = null) {
    const stats = await this.getOrCreateCraftingStats(userId, transaction);
    stats.total_crafts_completed += 1;
    
    // Mark first craft achievement
    if (!stats.first_craft_at) {
      stats.first_craft_at = new Date();
    }
    
    await stats.save({ transaction });
    return stats.total_crafts_completed;
  }

  /**
   * Increment craft cancelled counter
   */
  async incrementCraftsCancelled(userId, transaction = null) {
    const stats = await this.getOrCreateCraftingStats(userId, transaction);
    stats.total_crafts_cancelled += 1;
    await stats.save({ transaction });
    return stats.total_crafts_cancelled;
  }

  /**
   * Track resource consumption
   */
  async addResourceConsumption(userId, resourcesConsumed, transaction = null) {
    const stats = await this.getOrCreateCraftingStats(userId, transaction);
    
    const t1Consumed = stats.resources_t1_consumed || {};
    const t2Consumed = stats.resources_t2_consumed || {};

    // Add T1 resources
    if (resourcesConsumed.resources_t1) {
      for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t1)) {
        t1Consumed[resource] = (t1Consumed[resource] || 0) + amount;
      }
    }

    // Add T2 resources
    if (resourcesConsumed.resources_t2) {
      for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t2)) {
        t2Consumed[resource] = (t2Consumed[resource] || 0) + amount;
      }
    }

    stats.resources_t1_consumed = t1Consumed;
    stats.resources_t2_consumed = t2Consumed;
    
    await stats.save({ transaction });

    logger.info('Resource consumption tracked', { userId, t1Consumed, t2Consumed });
  }

  /**
   * Mark rarity achievement (first craft of rarity)
   */
  async markRarityAchievement(userId, rarity, transaction = null) {
    const stats = await this.getOrCreateCraftingStats(userId, transaction);
    
    const field = `first_${rarity}_craft_at`;
    
    if (!stats[field]) {
      stats[field] = new Date();
      await stats.save({ transaction });
      
      logger.info('Rarity achievement unlocked', { userId, rarity });
      return true;
    }
    
    return false;
  }

  /**
   * Get global crafting statistics
   */
  async getGlobalCraftingStats() {
    const [totalUsers, totalCrafts, totalXp] = await Promise.all([
      this.PlayerCraftingStats.count(),
      
      this.PlayerCraftingStats.sum('total_crafts_completed'),
      
      this.PlayerCraftingStats.sum('crafting_xp')
    ]);

    const topCrafters = await this.PlayerCraftingStats.findAll({
      order: [['total_crafts_completed', 'DESC']],
      limit: 10,
      include: [
        {
          model: this.User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });

    return {
      totalUsers,
      totalCrafts: totalCrafts || 0,
      totalXp: totalXp || 0,
      averageCraftsPerUser: totalUsers > 0 ? Math.round((totalCrafts || 0) / totalUsers) : 0,
      topCrafters: topCrafters.map(s => ({
        username: s.user?.username,
        craftsCompleted: s.total_crafts_completed,
        level: s.crafting_level,
        xp: s.crafting_xp
      }))
    };
  }

  /**
   * Get leaderboard (top crafters)
   */
  async getLeaderboard(limit = 100, offset = 0) {
    return this.PlayerCraftingStats.findAll({
      order: [
        ['crafting_level', 'DESC'],
        ['crafting_xp', 'DESC'],
        ['total_crafts_completed', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: this.User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });
  }
}

module.exports = CraftingRepository;
