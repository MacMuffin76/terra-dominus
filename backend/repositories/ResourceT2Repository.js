const db = require('../models');
const { Op } = require('sequelize');

const UserResourceT2 = db.UserResourceT2;
const ResourceConversion = db.ResourceConversion;
const ResourceConversionRecipe = db.ResourceConversionRecipe;
const User = db.User;

class ResourceT2Repository {
  /**
   * Get or create T2 resources for a user
   * @param {number} userId - User ID
   * @param {object} transaction - Optional Sequelize transaction
   * @returns {Promise<UserResourceT2>}
   */
  async getOrCreateUserResources(userId, transaction = null) {
    const [resources] = await UserResourceT2.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        titanium: 0,
        plasma: 0,
        nanotubes: 0,
        titaniumStorageMax: 0,
        plasmaStorageMax: 0,
        nanotubesStorageMax: 0,
        lastProductionAt: new Date(),
      },
      transaction,
    });

    return resources;
  }

  /**
   * Get user's T2 resources
   * @param {number} userId - User ID
   * @returns {Promise<UserResourceT2|null>}
   */
  async getUserResources(userId) {
    return await UserResourceT2.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username'],
        },
      ],
    });
  }

  /**
   * Update user's T2 resources
   * @param {number} userId - User ID
   * @param {object} resources - Resources to update { titanium, plasma, nanotubes }
   * @param {object} transaction - Optional Sequelize transaction
   * @returns {Promise<UserResourceT2>}
   */
  async updateResources(userId, resources, transaction = null) {
    await UserResourceT2.update(resources, {
      where: { userId },
      transaction,
    });

    return await this.getUserResources(userId);
  }

  /**
   * Add T2 resources to user (with storage cap check)
   * @param {number} userId - User ID
   * @param {string} resourceType - 'titanium', 'plasma', 'nanotubes'
   * @param {number} amount - Amount to add
   * @param {object} transaction - Optional Sequelize transaction
   * @returns {Promise<{added: number, overflow: number}>}
   */
  async addResource(userId, resourceType, amount, transaction = null) {
    const resources = await this.getOrCreateUserResources(userId, transaction);
    
    const storageMaxField = `${resourceType}StorageMax`;
    const currentAmount = resources[resourceType];
    const maxStorage = resources[storageMaxField];

    // Calculate how much can be added without exceeding storage
    const availableSpace = maxStorage - currentAmount;
    const amountToAdd = Math.min(amount, availableSpace);
    const overflow = amount - amountToAdd;

    if (amountToAdd > 0) {
      await resources.update(
        {
          [resourceType]: currentAmount + amountToAdd,
        },
        { transaction }
      );
    }

    return {
      added: amountToAdd,
      overflow,
    };
  }

  /**
   * Deduct T2 resources from user
   * @param {number} userId - User ID
   * @param {string} resourceType - 'titanium', 'plasma', 'nanotubes'
   * @param {number} amount - Amount to deduct
   * @param {object} transaction - Optional Sequelize transaction
   * @returns {Promise<boolean>} - Success
   */
  async deductResource(userId, resourceType, amount, transaction = null) {
    const resources = await this.getOrCreateUserResources(userId, transaction);
    
    if (resources[resourceType] < amount) {
      throw new Error(`Insufficient ${resourceType}. Have: ${resources[resourceType]}, Need: ${amount}`);
    }

    await resources.update(
      {
        [resourceType]: resources[resourceType] - amount,
      },
      { transaction }
    );

    return true;
  }

  /**
   * Update storage capacity for T2 resources
   * @param {number} userId - User ID
   * @param {object} capacities - { titaniumStorageMax, plasmaStorageMax, nanotubesStorageMax }
   * @param {object} transaction - Optional Sequelize transaction
   */
  async updateStorageCapacity(userId, capacities, transaction = null) {
    await UserResourceT2.update(capacities, {
      where: { userId },
      transaction,
    });
  }

  /**
   * Update last production timestamp
   * @param {number} userId - User ID
   * @param {Date} timestamp - Timestamp
   * @param {object} transaction - Optional Sequelize transaction
   */
  async updateLastProduction(userId, timestamp = new Date(), transaction = null) {
    await UserResourceT2.update(
      { lastProductionAt: timestamp },
      { where: { userId }, transaction }
    );
  }

  // ==================== CONVERSION METHODS ====================

  /**
   * Create a new resource conversion
   * @param {object} conversionData - Conversion data
   * @param {object} transaction - Optional Sequelize transaction
   * @returns {Promise<ResourceConversion>}
   */
  async createConversion(conversionData, transaction = null) {
    return await ResourceConversion.create(conversionData, { transaction });
  }

  /**
   * Get user's active conversions
   * @param {number} userId - User ID
   * @param {object} options - { status, limit, offset }
   * @returns {Promise<ResourceConversion[]>}
   */
  async getUserConversions(userId, options = {}) {
    const where = { userId };

    if (options.status) {
      where.status = options.status;
    }

    return await ResourceConversion.findAll({
      where,
      order: [['startedAt', 'DESC']],
      limit: options.limit || 10,
      offset: options.offset || 0,
    });
  }

  /**
   * Get conversion by ID
   * @param {number} conversionId - Conversion ID
   * @returns {Promise<ResourceConversion|null>}
   */
  async getConversionById(conversionId) {
    return await ResourceConversion.findByPk(conversionId);
  }

  /**
   * Update conversion status
   * @param {number} conversionId - Conversion ID
   * @param {string} status - New status
   * @param {object} transaction - Optional Sequelize transaction
   */
  async updateConversionStatus(conversionId, status, transaction = null) {
    await ResourceConversion.update(
      { status },
      { where: { id: conversionId }, transaction }
    );
  }

  /**
   * Get completed conversions that haven't been processed
   * @returns {Promise<ResourceConversion[]>}
   */
  async getCompletedConversions() {
    return await ResourceConversion.findAll({
      where: {
        status: 'in_progress',
        completedAt: {
          [Op.lte]: new Date(),
        },
      },
    });
  }

  /**
   * Mark conversion as completed
   * @param {number} conversionId - Conversion ID
   * @param {object} transaction - Optional Sequelize transaction
   */
  async completeConversion(conversionId, transaction = null) {
    await ResourceConversion.update(
      {
        status: 'completed',
        completedAt: new Date(),
      },
      { where: { id: conversionId }, transaction }
    );
  }

  /**
   * Cancel a conversion
   * @param {number} conversionId - Conversion ID
   * @param {object} transaction - Optional Sequelize transaction
   */
  async cancelConversion(conversionId, transaction = null) {
    await ResourceConversion.update(
      {
        status: 'cancelled',
      },
      { where: { id: conversionId }, transaction }
    );
  }

  /**
   * Count active conversions for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  async countActiveConversions(userId) {
    return await ResourceConversion.count({
      where: {
        userId,
        status: {
          [Op.in]: ['queued', 'in_progress'],
        },
      },
    });
  }

  // ==================== RECIPE METHODS ====================

  /**
   * Get all active conversion recipes
   * @returns {Promise<ResourceConversionRecipe[]>}
   */
  async getAllRecipes() {
    return await ResourceConversionRecipe.findAll({
      where: { isActive: true },
      order: [['resourceType', 'ASC']],
    });
  }

  /**
   * Get recipe for a specific resource type
   * @param {string} resourceType - 'titanium', 'plasma', 'nanotubes'
   * @returns {Promise<ResourceConversionRecipe|null>}
   */
  async getRecipeByType(resourceType) {
    return await ResourceConversionRecipe.findOne({
      where: {
        resourceType,
        isActive: true,
      },
    });
  }

  /**
   * Update recipe (admin only)
   * @param {number} recipeId - Recipe ID
   * @param {object} updates - Updates
   * @param {object} transaction - Optional Sequelize transaction
   */
  async updateRecipe(recipeId, updates, transaction = null) {
    await ResourceConversionRecipe.update(updates, {
      where: { id: recipeId },
      transaction,
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get total T2 resources in the game
   * @returns {Promise<object>} - { titanium, plasma, nanotubes }
   */
  async getTotalResources() {
    const result = await UserResourceT2.findOne({
      attributes: [
        [UserResourceT2.sequelize.fn('SUM', UserResourceT2.sequelize.col('titanium')), 'totalTitanium'],
        [UserResourceT2.sequelize.fn('SUM', UserResourceT2.sequelize.col('plasma')), 'totalPlasma'],
        [UserResourceT2.sequelize.fn('SUM', UserResourceT2.sequelize.col('nanotubes')), 'totalNanotubes'],
      ],
      raw: true,
    });

    return {
      titanium: parseInt(result?.totalTitanium || 0),
      plasma: parseInt(result?.totalPlasma || 0),
      nanotubes: parseInt(result?.totalNanotubes || 0),
    };
  }

  /**
   * Get conversion statistics
   * @param {number} userId - Optional user ID filter
   * @returns {Promise<object>}
   */
  async getConversionStats(userId = null) {
    const where = userId ? { userId } : {};

    const result = await ResourceConversion.findAll({
      where,
      attributes: [
        'status',
        [ResourceConversion.sequelize.fn('COUNT', ResourceConversion.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const stats = {
      queued: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    result.forEach((row) => {
      stats[row.status] = parseInt(row.count);
    });

    return stats;
  }
}

module.exports = new ResourceT2Repository();
