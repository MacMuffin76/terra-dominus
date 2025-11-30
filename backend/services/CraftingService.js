const logger = require('../utils/logger');

class CraftingService {
  constructor({ craftingRepository, sequelize }) {
    this.craftingRepository = craftingRepository;
    this.sequelize = sequelize;

    // Configuration constants
    this.MAX_CRAFTING_SLOTS = {
      BASE: 3,
      LEVEL_5: 4,
      LEVEL_10: 5,
      LEVEL_15: 6,
      LEVEL_20_WITH_BONUS: 7 // Crafting level 20 bonus
    };

    this.SPEEDUP_COST = {
      CT_PER_MINUTE: 1,
      MIN_COST: 20,
      MAX_COST: 500
    };

    this.CANCEL_REFUND_RATE = 0.5; // 50% refund
  }

  // ==================== BLUEPRINTS ====================

  /**
   * Get all available blueprints
   */
  async getAllBlueprints(filters = {}) {
    try {
      return await this.craftingRepository.getAllBlueprints(filters);
    } catch (error) {
      logger.error('Failed to get all blueprints', { error: error.message });
      throw error;
    }
  }

  /**
   * Get blueprint by ID
   */
  async getBlueprintById(blueprintId) {
    try {
      const blueprint = await this.craftingRepository.getBlueprintById(blueprintId);
      if (!blueprint) {
        throw new Error('Blueprint not found');
      }
      return blueprint;
    } catch (error) {
      logger.error('Failed to get blueprint', { error: error.message, blueprintId });
      throw error;
    }
  }

  /**
   * Get user's discovered blueprints
   */
  async getUserBlueprints(userId) {
    try {
      const blueprints = await this.craftingRepository.getUserBlueprints(userId);
      
      return blueprints.map(pb => ({
        blueprintId: pb.blueprint.id,
        name: pb.blueprint.name,
        category: pb.blueprint.category,
        rarity: pb.blueprint.rarity,
        craftingStationLevelMin: pb.blueprint.crafting_station_level_min,
        inputs: pb.blueprint.inputs,
        outputs: pb.blueprint.outputs,
        durationSeconds: pb.blueprint.duration_seconds,
        experienceReward: pb.blueprint.experience_reward,
        description: pb.blueprint.description,
        iconUrl: pb.blueprint.icon_url,
        unlockRequirements: pb.blueprint.unlock_requirements,
        isTradeable: pb.blueprint.is_tradeable,
        isAllianceCraft: pb.blueprint.is_alliance_craft,
        discoveredAt: pb.discovered_at,
        discoverySource: pb.discovery_source,
        timesCrafted: pb.times_crafted
      }));
    } catch (error) {
      logger.error('Failed to get user blueprints', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Grant blueprint to user (discovery)
   */
  async grantBlueprint(userId, blueprintId, source = 'admin_grant') {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Verify blueprint exists
      const blueprint = await this.craftingRepository.getBlueprintById(blueprintId);
      if (!blueprint) {
        throw new Error('Blueprint not found');
      }

      // Grant blueprint
      const playerBlueprint = await this.craftingRepository.grantBlueprint(
        userId, 
        blueprintId, 
        source, 
        transaction
      );

      await transaction.commit();

      logger.info('Blueprint granted', { userId, blueprintId, source });

      return {
        success: true,
        blueprint: {
          id: blueprint.id,
          name: blueprint.name,
          rarity: blueprint.rarity,
          discoveredAt: playerBlueprint.discovered_at
        }
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to grant blueprint', { error: error.message, userId, blueprintId });
      throw error;
    }
  }

  /**
   * Get blueprint discovery statistics
   */
  async getBlueprintStats(userId) {
    try {
      return await this.craftingRepository.getBlueprintDiscoveryStats(userId);
    } catch (error) {
      logger.error('Failed to get blueprint stats', { error: error.message, userId });
      throw error;
    }
  }

  // ==================== CRAFTING ====================

  /**
   * Start a craft
   */
  async startCraft(userId, blueprintId, quantity = 1) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // 1. Verify user owns blueprint
      const hasBlueprint = await this.craftingRepository.hasBlueprint(userId, blueprintId);
      if (!hasBlueprint) {
        throw new Error('Blueprint not discovered');
      }

      // 2. Get blueprint details
      const blueprint = await this.craftingRepository.getBlueprintById(blueprintId);
      if (!blueprint || !blueprint.is_active) {
        throw new Error('Blueprint not available');
      }

      // 3. Check active craft slots
      const activeCrafts = await this.craftingRepository.countActiveCrafts(userId);
      const maxSlots = await this._getMaxCraftingSlots(userId, transaction);
      
      if (activeCrafts >= maxSlots) {
        throw new Error(`Maximum ${maxSlots} crafts active. Cancel or wait for completion.`);
      }

      // 4. Validate unlock requirements
      // TODO: Check research, buildings when those systems are integrated
      const unlockRequirements = blueprint.unlock_requirements || {};
      if (unlockRequirements.research || unlockRequirements.building) {
        logger.warn('Unlock requirements not yet validated (research/building integration pending)', {
          userId,
          blueprintId,
          requirements: unlockRequirements
        });
      }

      // 5. Check and deduct resources
      // TODO: Integrate with resource system for actual deduction
      const resourcesNeeded = blueprint.inputs;
      logger.info('Resources needed for craft (deduction not yet implemented)', {
        userId,
        blueprintId,
        resourcesNeeded
      });

      // 6. Calculate completion time
      const now = new Date();
      const durationSeconds = blueprint.duration_seconds;
      const completedAt = new Date(now.getTime() + durationSeconds * 1000);

      // 7. Create craft entry
      const craft = await this.craftingRepository.createCraft({
        userId,
        blueprintId,
        quantity,
        resourcesConsumed: resourcesNeeded,
        completedAt
      }, transaction);

      // 8. Track resource consumption in stats
      await this.craftingRepository.addResourceConsumption(
        userId,
        resourcesNeeded,
        transaction
      );

      // 9. Increment blueprint craft count
      await this.craftingRepository.incrementBlueprintCraftCount(
        userId,
        blueprintId,
        transaction
      );

      await transaction.commit();

      logger.info('Craft started successfully', {
        craftId: craft.id,
        userId,
        blueprintId,
        durationSeconds,
        completedAt
      });

      return {
        success: true,
        craft: {
          id: craft.id,
          blueprintId: craft.blueprint_id,
          blueprintName: blueprint.name,
          rarity: blueprint.rarity,
          quantityTarget: craft.quantity_target,
          resourcesConsumed: craft.resources_consumed,
          startedAt: craft.started_at,
          completedAt: craft.completed_at,
          durationSeconds,
          status: craft.status
        }
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to start craft', { error: error.message, userId, blueprintId });
      throw error;
    }
  }

  /**
   * Get user's crafting queue
   */
  async getUserCrafts(userId, options = {}) {
    try {
      const crafts = await this.craftingRepository.getUserCrafts(userId, options);

      return crafts.map(craft => {
        const timeRemaining = this._calculateTimeRemaining(craft);
        const progressPercentage = this._calculateProgressPercentage(craft);

        return {
          id: craft.id,
          blueprintId: craft.blueprint_id,
          blueprintName: craft.blueprint?.name,
          blueprintRarity: craft.blueprint?.rarity,
          blueprintCategory: craft.blueprint?.category,
          quantityTarget: craft.quantity_target,
          resourcesConsumed: craft.resources_consumed,
          startedAt: craft.started_at,
          completedAt: craft.completed_at,
          collectedAt: craft.collected_at,
          status: craft.status,
          outputItems: craft.output_items,
          timeRemaining,
          progressPercentage,
          isReady: craft.status === 'in_progress' && timeRemaining === 0
        };
      });
    } catch (error) {
      logger.error('Failed to get user crafts', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Cancel a craft (50% refund)
   */
  async cancelCraft(userId, craftId) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // 1. Get craft and verify ownership
      const craft = await this.craftingRepository.getCraftByIdAndUser(craftId, userId, transaction);
      if (!craft) {
        throw new Error('Craft not found or unauthorized');
      }

      if (craft.status !== 'in_progress') {
        throw new Error('Can only cancel in-progress crafts');
      }

      // 2. Cancel craft
      await this.craftingRepository.cancelCraft(craftId, transaction);

      // 3. Calculate refund (50%)
      const refund = this._calculateRefund(craft.resources_consumed);

      // 4. Award refund
      // TODO: Integrate with resource system to actually refund
      logger.info('Refund calculated (not yet awarded, resource integration pending)', {
        userId,
        craftId,
        refund
      });

      // 5. Update stats
      await this.craftingRepository.incrementCraftsCancelled(userId, transaction);

      await transaction.commit();

      logger.info('Craft cancelled', { craftId, userId, refund });

      return {
        success: true,
        cancelled: true,
        refund
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to cancel craft', { error: error.message, userId, craftId });
      throw error;
    }
  }

  /**
   * Speedup craft with premium currency
   */
  async speedupCraft(userId, craftId) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // 1. Get craft and verify ownership
      const craft = await this.craftingRepository.getCraftByIdAndUser(craftId, userId, transaction);
      if (!craft) {
        throw new Error('Craft not found or unauthorized');
      }

      if (craft.status !== 'in_progress') {
        throw new Error('Can only speedup in-progress crafts');
      }

      // 2. Calculate speedup cost
      const timeRemaining = this._calculateTimeRemaining(craft);
      if (timeRemaining === 0) {
        throw new Error('Craft already completed');
      }

      const speedupCost = this._calculateSpeedupCost(timeRemaining);

      // 3. Check and deduct premium currency
      // TODO: Integrate with premium currency system
      logger.warn('Premium currency deduction not yet implemented', {
        userId,
        craftId,
        speedupCost
      });

      // 4. Complete craft immediately
      const blueprint = craft.blueprint;
      const outputItems = blueprint.outputs;

      await this.craftingRepository.completeCraft(craftId, outputItems, transaction);

      // 5. Award output items
      // TODO: Integrate with item/unit/building systems
      logger.info('Output items calculated (not yet awarded, system integration pending)', {
        userId,
        craftId,
        outputItems
      });

      // 6. Award XP and update stats
      const xpResult = await this.craftingRepository.addCraftingXP(
        userId,
        blueprint.experience_reward,
        transaction
      );

      await this.craftingRepository.incrementCraftsCompleted(userId, transaction);

      // 7. Check rarity achievement
      await this.craftingRepository.markRarityAchievement(userId, blueprint.rarity, transaction);

      await transaction.commit();

      logger.info('Craft speedup completed', {
        craftId,
        userId,
        speedupCost,
        xpGained: xpResult.xpAdded,
        leveledUp: xpResult.leveledUp
      });

      return {
        success: true,
        completed: true,
        speedupCost,
        outputItems,
        xpGained: xpResult.xpAdded,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to speedup craft', { error: error.message, userId, craftId });
      throw error;
    }
  }

  /**
   * Collect completed craft
   */
  async collectCraft(userId, craftId) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // 1. Get craft and verify ownership
      const craft = await this.craftingRepository.getCraftByIdAndUser(craftId, userId, transaction);
      if (!craft) {
        throw new Error('Craft not found or unauthorized');
      }

      if (craft.status !== 'completed') {
        throw new Error('Craft not completed yet');
      }

      // 2. Award output items
      const outputItems = craft.output_items;
      
      // TODO: Integrate with item/unit/building systems to actually award
      logger.info('Output items to be awarded (system integration pending)', {
        userId,
        craftId,
        outputItems
      });

      // 3. Mark as collected
      await this.craftingRepository.collectCraft(craftId, transaction);

      await transaction.commit();

      logger.info('Craft collected', { craftId, userId, outputItems });

      return {
        success: true,
        collected: true,
        outputItems
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to collect craft', { error: error.message, userId, craftId });
      throw error;
    }
  }

  /**
   * Process completed crafts (cron job)
   */
  async processCompletedCrafts() {
    const transaction = await this.sequelize.transaction();
    
    try {
      const readyCrafts = await this.craftingRepository.getReadyCrafts();

      logger.info(`Processing ${readyCrafts.length} completed crafts`);

      let processedCount = 0;

      for (const craft of readyCrafts) {
        try {
          const blueprint = craft.blueprint;
          const outputItems = blueprint.outputs;

          // Complete craft
          await this.craftingRepository.completeCraft(craft.id, outputItems, transaction);

          // Award XP
          await this.craftingRepository.addCraftingXP(
            craft.user_id,
            blueprint.experience_reward,
            transaction
          );

          // Update stats
          await this.craftingRepository.incrementCraftsCompleted(craft.user_id, transaction);

          // Check rarity achievement
          await this.craftingRepository.markRarityAchievement(
            craft.user_id,
            blueprint.rarity,
            transaction
          );

          processedCount++;

          logger.info('Craft auto-completed', {
            craftId: craft.id,
            userId: craft.user_id,
            blueprintName: blueprint.name
          });
        } catch (error) {
          logger.error('Failed to process individual craft', {
            error: error.message,
            craftId: craft.id
          });
          // Continue processing other crafts
        }
      }

      await transaction.commit();

      logger.info(`Processed ${processedCount} crafts successfully`);
      return processedCount;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to process completed crafts', { error: error.message });
      throw error;
    }
  }

  // ==================== CRAFTING STATS ====================

  /**
   * Get user's crafting statistics
   */
  async getUserCraftingStats(userId) {
    try {
      const stats = await this.craftingRepository.getCraftingStats(userId);
      
      if (!stats) {
        return {
          craftingXp: 0,
          craftingLevel: 1,
          totalCraftsCompleted: 0,
          totalCraftsCancelled: 0,
          resourcesT1Consumed: {},
          resourcesT2Consumed: {},
          achievements: {}
        };
      }

      const levelInfo = this._getLevelProgress(stats);
      const bonuses = this._getLevelBonuses(stats.crafting_level);

      return {
        craftingXp: stats.crafting_xp,
        craftingLevel: stats.crafting_level,
        levelProgress: levelInfo,
        bonuses,
        totalCraftsCompleted: stats.total_crafts_completed,
        totalCraftsCancelled: stats.total_crafts_cancelled,
        resourcesT1Consumed: stats.resources_t1_consumed || {},
        resourcesT2Consumed: stats.resources_t2_consumed || {},
        achievements: {
          firstCraft: stats.first_craft_at,
          firstRare: stats.first_rare_craft_at,
          firstEpic: stats.first_epic_craft_at,
          firstLegendary: stats.first_legendary_craft_at
        }
      };
    } catch (error) {
      logger.error('Failed to get user crafting stats', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get global crafting statistics
   */
  async getGlobalStats() {
    try {
      return await this.craftingRepository.getGlobalCraftingStats();
    } catch (error) {
      logger.error('Failed to get global crafting stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get crafting leaderboard
   */
  async getLeaderboard(limit = 100, offset = 0) {
    try {
      const entries = await this.craftingRepository.getLeaderboard(limit, offset);

      return entries.map(entry => ({
        userId: entry.user_id,
        username: entry.user?.username || 'Unknown',
        craftingLevel: entry.crafting_level,
        craftingXp: entry.crafting_xp,
        totalCraftsCompleted: entry.total_crafts_completed,
        resourcesT2Consumed: entry.resources_t2_consumed || {}
      }));
    } catch (error) {
      logger.error('Failed to get leaderboard', { error: error.message });
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Get max crafting slots for user
   */
  async _getMaxCraftingSlots(userId, transaction) {
    // TODO: Check crafting station level from building system
    // For now, assume base crafting station level 10 = 5 slots
    const baseSlotsFromStation = this.MAX_CRAFTING_SLOTS.LEVEL_10;

    // Check if user has level 20+ crafting bonus
    const stats = await this.craftingRepository.getCraftingStats(userId);
    const bonusSlot = stats && stats.crafting_level >= 20 ? 1 : 0;

    return baseSlotsFromStation + bonusSlot;
  }

  /**
   * Calculate time remaining in seconds
   */
  _calculateTimeRemaining(craft) {
    if (craft.status !== 'in_progress') {
      return 0;
    }

    const now = new Date();
    const completedAt = new Date(craft.completed_at);
    const remaining = Math.max(0, Math.floor((completedAt - now) / 1000));
    
    return remaining;
  }

  /**
   * Calculate progress percentage
   */
  _calculateProgressPercentage(craft) {
    if (craft.status === 'completed' || craft.status === 'collected') {
      return 100;
    }
    if (craft.status === 'cancelled') {
      return 0;
    }

    const now = new Date();
    const startedAt = new Date(craft.started_at);
    const completedAt = new Date(craft.completed_at);
    
    const totalDuration = completedAt - startedAt;
    const elapsed = now - startedAt;
    
    return Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));
  }

  /**
   * Calculate speedup cost in premium currency
   */
  _calculateSpeedupCost(timeRemainingSeconds) {
    const minutes = Math.ceil(timeRemainingSeconds / 60);
    const cost = Math.max(
      this.SPEEDUP_COST.MIN_COST,
      minutes * this.SPEEDUP_COST.CT_PER_MINUTE
    );
    
    return Math.min(cost, this.SPEEDUP_COST.MAX_COST);
  }

  /**
   * Calculate refund (50% of resources)
   */
  _calculateRefund(resourcesConsumed) {
    const refund = {};

    if (resourcesConsumed.resources_t1) {
      refund.resources_t1 = {};
      for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t1)) {
        refund.resources_t1[resource] = Math.floor(amount * this.CANCEL_REFUND_RATE);
      }
    }

    if (resourcesConsumed.resources_t2) {
      refund.resources_t2 = {};
      for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t2)) {
        refund.resources_t2[resource] = Math.floor(amount * this.CANCEL_REFUND_RATE);
      }
    }

    // Premium currency is NOT refunded
    return refund;
  }

  /**
   * Get level progress information
   */
  _getLevelProgress(stats) {
    const currentXp = stats.crafting_xp;
    const currentLevel = stats.crafting_level;
    
    // XP curve: Level N requires (N * 1000) XP
    let xpForCurrentLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpForCurrentLevel += i * 1000;
    }
    
    const xpInCurrentLevel = currentXp - xpForCurrentLevel;
    const xpNeededForNext = currentLevel * 1000;
    const progressPercentage = Math.floor((xpInCurrentLevel / xpNeededForNext) * 100);

    return {
      currentLevel,
      currentXp: xpInCurrentLevel,
      xpNeededForNext,
      progressPercentage
    };
  }

  /**
   * Get bonuses for crafting level
   */
  _getLevelBonuses(level) {
    const bonuses = {
      durationReduction: 0,
      costReduction: 0,
      canMassCraft: false,
      extraSlot: false,
      doubleOutputChance: 0,
      instantCraftDaily: false
    };

    if (level >= 5) bonuses.durationReduction = 0.05; // -5%
    if (level >= 10) bonuses.costReduction = 0.10; // -10%
    if (level >= 15) bonuses.canMassCraft = true;
    if (level >= 20) bonuses.extraSlot = true; // +1 slot
    if (level >= 25) bonuses.doubleOutputChance = 0.05; // 5%
    if (level >= 30) bonuses.instantCraftDaily = true;

    return bonuses;
  }
}

module.exports = CraftingService;
