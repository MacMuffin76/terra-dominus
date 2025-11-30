const resourceT2Repository = require('../repositories/ResourceT2Repository');
const { sequelize } = require('../models');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ResourceT2Service' });

/**
 * Configuration des ressources T2
 */
const T2_CONFIG = {
  // Limite de conversions simultanées par joueur
  MAX_CONCURRENT_CONVERSIONS: 3,
  
  // Stockage de base (sans entrepôt T2)
  BASE_STORAGE: {
    titanium: 0,
    plasma: 0,
    nanotubes: 0,
  },
  
  // Stockage par niveau d'entrepôt T2
  STORAGE_PER_LEVEL: 200,
  BASE_STORAGE_WAREHOUSE: 500,
  
  // Taux de production passive depuis bâtiments
  PASSIVE_PRODUCTION: {
    titanium: {
      building: 'mine_metal',
      minLevel: 10,
      rate: 0.005, // 0.5% du métal produit → titanium
      perHour: true,
    },
    plasma: {
      building: 'centrale_energie',
      minLevel: 15,
      rate: 0.0001, // 0.01% de l'énergie → plasma
      perHour: true,
    },
    nanotubes: {
      building: 'labo_recherche',
      minLevel: 15,
      baseAmount: 1, // 1 nanotube toutes les 8h
      intervalHours: 8,
    },
  },
};

class ResourceT2Service {
  constructor(repository) {
    this.repository = repository || resourceT2Repository;
  }

  /**
   * Get user's T2 resources with calculated production
   * @param {number} userId - User ID
   * @returns {Promise<object>}
   */
  async getUserResources(userId) {
    let resources = await this.repository.getUserResources(userId);

    if (!resources) {
      resources = await this.repository.getOrCreateUserResources(userId);
    }

    return {
      titanium: parseInt(resources.titanium),
      plasma: parseInt(resources.plasma),
      nanotubes: parseInt(resources.nanotubes),
      storage: {
        titanium: resources.titaniumStorageMax,
        plasma: resources.plasmaStorageMax,
        nanotubes: resources.nanotubesStorageMax,
      },
      lastProductionAt: resources.lastProductionAt,
    };
  }

  /**
   * Start a resource conversion
   * @param {number} userId - User ID
   * @param {string} resourceType - 'titanium', 'plasma', 'nanotubes'
   * @param {number} quantity - Number of conversions to perform
   * @returns {Promise<object>}
   */
  async startConversion(userId, resourceType, quantity = 1) {
    const transaction = await sequelize.transaction();

    try {
      // Validate resource type
      if (!['titanium', 'plasma', 'nanotubes'].includes(resourceType)) {
        throw new Error(`Invalid resource type: ${resourceType}`);
      }

      // Check conversion limit
      const activeConversions = await this.repository.countActiveConversions(userId);
      if (activeConversions >= T2_CONFIG.MAX_CONCURRENT_CONVERSIONS) {
        throw new Error(
          `Maximum ${T2_CONFIG.MAX_CONCURRENT_CONVERSIONS} concurrent conversions reached`
        );
      }

      // Get recipe
      const recipe = await this.repository.getRecipeByType(resourceType);
      if (!recipe) {
        throw new Error(`No recipe found for ${resourceType}`);
      }

      // Validate building and research requirements
      // TODO: Check user has required building level
      // TODO: Check user has completed required research

      // Calculate total input cost
      const inputCost = {};
      for (const [resource, amount] of Object.entries(recipe.inputResources)) {
        inputCost[resource] = amount * quantity;
      }

      // Check user has enough T1 resources
      // TODO: Deduct T1 resources from user
      logger.info({ userId, inputCost }, 'Would deduct T1 resources (not implemented yet)');

      // Calculate completion time
      const durationSeconds = recipe.durationSeconds * quantity;
      const completedAt = new Date(Date.now() + durationSeconds * 1000);

      // Create conversion
      const conversion = await this.repository.createConversion(
        {
          userId,
          resourceType,
          quantityTarget: recipe.outputQuantity * quantity,
          inputCost,
          startedAt: new Date(),
          completedAt,
          status: 'in_progress',
        },
        transaction
      );

      await transaction.commit();

      logger.info(
        { userId, conversionId: conversion.id, resourceType, quantity },
        'Conversion started'
      );

      return {
        conversionId: conversion.id,
        resourceType,
        quantityTarget: conversion.quantityTarget,
        inputCost: conversion.inputCost,
        duration: durationSeconds,
        completedAt: conversion.completedAt,
        status: conversion.status,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ error, userId, resourceType }, 'Failed to start conversion');
      throw error;
    }
  }

  /**
   * Get user's conversions
   * @param {number} userId - User ID
   * @param {object} options - { status, limit, offset }
   * @returns {Promise<object[]>}
   */
  async getUserConversions(userId, options = {}) {
    const conversions = await this.repository.getUserConversions(userId, options);

    return conversions.map((c) => ({
      id: c.id,
      resourceType: c.resourceType,
      quantityTarget: c.quantityTarget,
      inputCost: c.inputCost,
      startedAt: c.startedAt,
      completedAt: c.completedAt,
      status: c.status,
      timeRemaining: this._calculateTimeRemaining(c),
    }));
  }

  /**
   * Cancel a conversion (returns partial resources)
   * @param {number} userId - User ID
   * @param {number} conversionId - Conversion ID
   * @returns {Promise<object>}
   */
  async cancelConversion(userId, conversionId) {
    const transaction = await sequelize.transaction();

    try {
      const conversion = await this.repository.getConversionById(conversionId);

      if (!conversion) {
        throw new Error('Conversion not found');
      }

      if (conversion.userId !== userId) {
        throw new Error('Not authorized to cancel this conversion');
      }

      if (conversion.status !== 'in_progress' && conversion.status !== 'queued') {
        throw new Error(`Cannot cancel conversion with status: ${conversion.status}`);
      }

      // Calculate refund (50% of input cost)
      const refund = {};
      for (const [resource, amount] of Object.entries(conversion.inputCost)) {
        refund[resource] = Math.floor(amount * 0.5);
      }

      // TODO: Refund T1 resources to user

      await this.repository.cancelConversion(conversionId, transaction);

      await transaction.commit();

      logger.info({ userId, conversionId, refund }, 'Conversion cancelled');

      return {
        cancelled: true,
        refund,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ error, userId, conversionId }, 'Failed to cancel conversion');
      throw error;
    }
  }

  /**
   * Complete a conversion instantly (with speedup currency)
   * @param {number} userId - User ID
   * @param {number} conversionId - Conversion ID
   * @returns {Promise<object>}
   */
  async speedupConversion(userId, conversionId) {
    const transaction = await sequelize.transaction();

    try {
      const conversion = await this.repository.getConversionById(conversionId);

      if (!conversion) {
        throw new Error('Conversion not found');
      }

      if (conversion.userId !== userId) {
        throw new Error('Not authorized to speedup this conversion');
      }

      if (conversion.status !== 'in_progress') {
        throw new Error(`Cannot speedup conversion with status: ${conversion.status}`);
      }

      // Calculate speedup cost based on time remaining
      const timeRemaining = this._calculateTimeRemaining(conversion);
      const speedupCost = this._calculateSpeedupCost(timeRemaining);

      // TODO: Deduct premium currency from user
      logger.info({ userId, conversionId, speedupCost }, 'Would deduct speedup cost');

      // Complete the conversion immediately
      await this._completeConversion(conversion, transaction);

      await transaction.commit();

      logger.info({ userId, conversionId, speedupCost }, 'Conversion speedup completed');

      return {
        completed: true,
        speedupCost,
        resourcesAwarded: conversion.quantityTarget,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ error, userId, conversionId }, 'Failed to speedup conversion');
      throw error;
    }
  }

  /**
   * Process completed conversions (called by cron job)
   * @returns {Promise<number>} - Number of conversions processed
   */
  async processCompletedConversions() {
    const conversions = await this.repository.getCompletedConversions();
    let processed = 0;

    for (const conversion of conversions) {
      const transaction = await sequelize.transaction();

      try {
        await this._completeConversion(conversion, transaction);
        await transaction.commit();
        processed++;
      } catch (error) {
        await transaction.rollback();
        logger.error(
          { error, conversionId: conversion.id },
          'Failed to process completed conversion'
        );
      }
    }

    if (processed > 0) {
      logger.info({ processed }, 'Processed completed conversions');
    }

    return processed;
  }

  /**
   * Calculate passive T2 production for a user
   * @param {number} userId - User ID
   * @param {object} userBuildings - User's buildings
   * @returns {Promise<object>}
   */
  async calculatePassiveProduction(userId, userBuildings) {
    const resources = await this.repository.getOrCreateUserResources(userId);
    const lastProduction = resources.lastProductionAt || new Date();
    const now = new Date();
    const hoursSinceLastProduction = (now - lastProduction) / (1000 * 60 * 60);

    const production = {
      titanium: 0,
      plasma: 0,
      nanotubes: 0,
    };

    // Titanium from metal mines level 10+
    const metalMines = userBuildings.filter(
      (b) =>
        b.type === 'mine_metal' && b.level >= T2_CONFIG.PASSIVE_PRODUCTION.titanium.minLevel
    );
    if (metalMines.length > 0) {
      // TODO: Calculate actual metal production rate
      const metalProductionPerHour = 1000; // Placeholder
      production.titanium = Math.floor(
        metalProductionPerHour *
          hoursSinceLastProduction *
          T2_CONFIG.PASSIVE_PRODUCTION.titanium.rate
      );
    }

    // Plasma from energy facilities level 15+
    const energyFacilities = userBuildings.filter(
      (b) =>
        b.type === 'centrale_energie' &&
        b.level >= T2_CONFIG.PASSIVE_PRODUCTION.plasma.minLevel
    );
    if (energyFacilities.length > 0) {
      // TODO: Calculate actual energy production rate
      const energyProductionPerHour = 10000; // Placeholder
      production.plasma = Math.floor(
        energyProductionPerHour *
          hoursSinceLastProduction *
          T2_CONFIG.PASSIVE_PRODUCTION.plasma.rate
      );
    }

    // Nanotubes from research labs level 15+
    const researchLabs = userBuildings.filter(
      (b) =>
        b.type === 'labo_recherche' &&
        b.level >= T2_CONFIG.PASSIVE_PRODUCTION.nanotubes.minLevel
    );
    if (researchLabs.length > 0) {
      const intervalsCompleted = Math.floor(
        hoursSinceLastProduction / T2_CONFIG.PASSIVE_PRODUCTION.nanotubes.intervalHours
      );
      production.nanotubes =
        intervalsCompleted * T2_CONFIG.PASSIVE_PRODUCTION.nanotubes.baseAmount;
    }

    return production;
  }

  /**
   * Award passive production to user
   * @param {number} userId - User ID
   * @param {object} userBuildings - User's buildings
   * @returns {Promise<object>}
   */
  async awardPassiveProduction(userId, userBuildings) {
    const transaction = await sequelize.transaction();

    try {
      const production = await this.calculatePassiveProduction(userId, userBuildings);

      // Award resources (with storage cap)
      const results = {};
      for (const [resourceType, amount] of Object.entries(production)) {
        if (amount > 0) {
          const result = await this.repository.addResource(
            userId,
            resourceType,
            amount,
            transaction
          );
          results[resourceType] = result;
        }
      }

      // Update last production timestamp
      await this.repository.updateLastProduction(userId, new Date(), transaction);

      await transaction.commit();

      logger.info({ userId, production, results }, 'Passive production awarded');

      return {
        production,
        awarded: results,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ error, userId }, 'Failed to award passive production');
      throw error;
    }
  }

  /**
   * Update storage capacity based on warehouse level
   * @param {number} userId - User ID
   * @param {number} warehouseLevel - Warehouse T2 level
   * @returns {Promise<object>}
   */
  async updateStorageCapacity(userId, warehouseLevel) {
    const capacity =
      T2_CONFIG.BASE_STORAGE_WAREHOUSE + warehouseLevel * T2_CONFIG.STORAGE_PER_LEVEL;

    await this.repository.updateStorageCapacity(userId, {
      titaniumStorageMax: capacity,
      plasmaStorageMax: capacity,
      nanotubesStorageMax: capacity,
    });

    logger.info({ userId, warehouseLevel, capacity }, 'Storage capacity updated');

    return { capacity };
  }

  /**
   * Get all available recipes
   * @returns {Promise<object[]>}
   */
  async getAvailableRecipes() {
    const recipes = await this.repository.getAllRecipes();

    return recipes.map((r) => ({
      resourceType: r.resourceType,
      inputResources: r.inputResources,
      outputQuantity: r.outputQuantity,
      durationSeconds: r.durationSeconds,
      buildingRequired: r.buildingRequired,
      buildingLevelMin: r.buildingLevelMin,
      researchRequired: r.researchRequired,
    }));
  }

  /**
   * Get T2 statistics
   * @param {number} userId - Optional user ID filter
   * @returns {Promise<object>}
   */
  async getStatistics(userId = null) {
    const [totalResources, conversionStats] = await Promise.all([
      userId ? this.getUserResources(userId) : this.repository.getTotalResources(),
      this.repository.getConversionStats(userId),
    ]);

    return {
      resources: totalResources,
      conversions: conversionStats,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Complete a conversion and award resources
   * @private
   */
  async _completeConversion(conversion, transaction) {
    // Award T2 resources
    await this.repository.addResource(
      conversion.userId,
      conversion.resourceType,
      conversion.quantityTarget,
      transaction
    );

    // Mark conversion as completed
    await this.repository.completeConversion(conversion.id, transaction);

    logger.info(
      {
        userId: conversion.userId,
        conversionId: conversion.id,
        resourceType: conversion.resourceType,
        quantity: conversion.quantityTarget,
      },
      'Conversion completed'
    );
  }

  /**
   * Calculate time remaining for a conversion
   * @private
   */
  _calculateTimeRemaining(conversion) {
    if (conversion.status !== 'in_progress') {
      return 0;
    }

    const now = new Date();
    const completedAt = new Date(conversion.completedAt);
    const remaining = Math.max(0, Math.floor((completedAt - now) / 1000));

    return remaining;
  }

  /**
   * Calculate speedup cost based on time remaining
   * @private
   */
  _calculateSpeedupCost(timeRemainingSeconds) {
    // 1 CT per 60 seconds, minimum 10 CT
    const cost = Math.max(10, Math.ceil(timeRemainingSeconds / 60));
    return cost;
  }
}

module.exports = ResourceT2Service;
