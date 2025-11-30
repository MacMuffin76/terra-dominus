const AllianceTerritoryRepository = require('../infra/AllianceTerritoryRepository');
const { AllianceMember, Alliance } = require('../../../models');
const { getLogger } = require('../../../utils/logger');
const sequelize = require('../../../db');

const logger = getLogger({ module: 'AllianceTerritoryService' });

/**
 * Alliance Territory Service - Business logic for territory management
 */
class AllianceTerritoryService {
  constructor() {
    this.territoryRepo = new AllianceTerritoryRepository();
  }

  /**
   * Territory types configuration
   */
  static TERRITORY_TYPES = {
    resource_node: {
      name: 'Resource Node',
      radius: 5,
      bonuses: { metalProduction: 0.2, goldProduction: 0.1 },
      cost: { gold: 50000, metal: 25000, fuel: 10000 },
    },
    strategic_point: {
      name: 'Strategic Point',
      radius: 7,
      bonuses: { allProduction: 0.1 },
      cost: { gold: 75000, metal: 30000, fuel: 20000, energy: 15000 },
    },
    defensive_outpost: {
      name: 'Defensive Outpost',
      radius: 4,
      bonuses: { defense: 0.3 },
      cost: { gold: 100000, metal: 50000, fuel: 30000 },
    },
    trade_hub: {
      name: 'Trade Hub',
      radius: 6,
      bonuses: { goldProduction: 0.25 },
      cost: { gold: 80000, metal: 20000, fuel: 15000 },
    },
  };

  /**
   * Defense upgrade costs
   */
  static DEFENSE_COSTS = {
    1: { gold: 0, metal: 0, fuel: 0 },
    2: { gold: 10000, metal: 5000, fuel: 2000 },
    3: { gold: 20000, metal: 10000, fuel: 4000 },
    4: { gold: 35000, metal: 17500, fuel: 7000 },
    5: { gold: 55000, metal: 27500, fuel: 11000 },
    6: { gold: 80000, metal: 40000, fuel: 16000 },
    7: { gold: 110000, metal: 55000, fuel: 22000 },
    8: { gold: 145000, metal: 72500, fuel: 29000 },
    9: { gold: 185000, metal: 92500, fuel: 37000 },
    10: { gold: 230000, metal: 115000, fuel: 46000 },
  };

  /**
   * Get all territories controlled by an alliance
   */
  async getAllianceTerritories(allianceId, userId) {
    try {
      // Check if user is in the alliance
      const member = await AllianceMember.findOne({
        where: { userId, allianceId },
      });

      if (!member) {
        const error = new Error('You are not a member of this alliance');
        error.status = 403;
        throw error;
      }

      const territories = await this.territoryRepo.getAllianceTerritories(allianceId);

      logger.info('Retrieved alliance territories', { allianceId, count: territories.length });

      return territories;
    } catch (error) {
      logger.error('Error getting alliance territories', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get territory by coordinates
   */
  async getTerritoryByCoords(x, y) {
    try {
      const territory = await this.territoryRepo.getTerritoryByCoords(x, y);

      if (!territory) {
        const error = new Error('Territory not found');
        error.status = 404;
        throw error;
      }

      return territory;
    } catch (error) {
      logger.error('Error getting territory by coords', { x, y, error: error.message });
      throw error;
    }
  }

  /**
   * Initiate territory capture
   */
  async initiateCapture(allianceId, userId, captureData) {
    const transaction = await sequelize.transaction();

    try {
      const { name, territoryType, coordX, coordY } = captureData;

      // Validate territory type
      if (!AllianceTerritoryService.TERRITORY_TYPES[territoryType]) {
        const error = new Error('Invalid territory type');
        error.status = 400;
        throw error;
      }

      // Check permissions (officer or leader)
      await this._checkPermission(allianceId, userId, ['officer', 'leader']);

      // Check if coordinates are already claimed
      const existing = await this.territoryRepo.getTerritoryByCoords(coordX, coordY);
      if (existing) {
        const error = new Error('Territory already claimed');
        error.status = 409;
        throw error;
      }

      // Get territory config
      const config = AllianceTerritoryService.TERRITORY_TYPES[territoryType];

      // Create territory
      const territory = await this.territoryRepo.claimTerritory({
        allianceId,
        name: name || config.name,
        territoryType,
        coordX,
        coordY,
        radius: config.radius,
        bonuses: config.bonuses,
      });

      await transaction.commit();

      logger.info('Territory capture initiated', {
        allianceId,
        territoryId: territory.id,
        userId,
        coords: { x: coordX, y: coordY },
      });

      return territory;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error initiating territory capture', {
        allianceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Upgrade territory defense
   */
  async upgradeDefense(allianceId, territoryId, userId) {
    try {
      // Check permissions (officer or leader)
      await this._checkPermission(allianceId, userId, ['officer', 'leader']);

      // Get territory
      const territory = await this.territoryRepo.getTerritoryById(territoryId);

      if (!territory) {
        const error = new Error('Territory not found');
        error.status = 404;
        throw error;
      }

      if (territory.allianceId !== allianceId) {
        const error = new Error('This territory does not belong to your alliance');
        error.status = 403;
        throw error;
      }

      const currentLevel = territory.defenseLevel;
      const newLevel = currentLevel + 1;

      if (newLevel > 10) {
        const error = new Error('Territory is already at maximum defense level');
        error.status = 400;
        throw error;
      }

      // Get upgrade cost
      const cost = AllianceTerritoryService.DEFENSE_COSTS[newLevel];

      // Upgrade defense
      const upgraded = await this.territoryRepo.upgradeTerritoryDefense(territoryId, newLevel);

      logger.info('Territory defense upgraded', {
        allianceId,
        territoryId,
        newLevel,
        userId,
      });

      return {
        territory: upgraded,
        cost,
      };
    } catch (error) {
      logger.error('Error upgrading territory defense', {
        territoryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reinforce garrison (add units)
   */
  async reinforceGarrison(allianceId, territoryId, userId, strength) {
    try {
      // Check permissions (any member can reinforce)
      await this._checkPermission(allianceId, userId, ['member', 'officer', 'leader']);

      // Get territory
      const territory = await this.territoryRepo.getTerritoryById(territoryId);

      if (!territory) {
        const error = new Error('Territory not found');
        error.status = 404;
        throw error;
      }

      if (territory.allianceId !== allianceId) {
        const error = new Error('This territory does not belong to your alliance');
        error.status = 403;
        throw error;
      }

      if (strength <= 0) {
        const error = new Error('Reinforcement strength must be positive');
        error.status = 400;
        throw error;
      }

      // Add to garrison
      const newStrength = territory.garrisonStrength + strength;
      const updated = await this.territoryRepo.updateGarrison(territoryId, newStrength);

      logger.info('Territory garrison reinforced', {
        allianceId,
        territoryId,
        userId,
        strength,
        newTotal: newStrength,
      });

      return updated;
    } catch (error) {
      logger.error('Error reinforcing garrison', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Withdraw garrison (remove units)
   */
  async withdrawGarrison(allianceId, territoryId, userId, strength) {
    try {
      // Check permissions (officer or leader)
      await this._checkPermission(allianceId, userId, ['officer', 'leader']);

      // Get territory
      const territory = await this.territoryRepo.getTerritoryById(territoryId);

      if (!territory) {
        const error = new Error('Territory not found');
        error.status = 404;
        throw error;
      }

      if (territory.allianceId !== allianceId) {
        const error = new Error('This territory does not belong to your alliance');
        error.status = 403;
        throw error;
      }

      if (strength <= 0) {
        const error = new Error('Withdrawal strength must be positive');
        error.status = 400;
        throw error;
      }

      if (strength > territory.garrisonStrength) {
        const error = new Error('Cannot withdraw more than current garrison strength');
        error.status = 400;
        throw error;
      }

      // Remove from garrison
      const newStrength = territory.garrisonStrength - strength;
      const updated = await this.territoryRepo.updateGarrison(territoryId, newStrength);

      logger.info('Territory garrison withdrawn', {
        allianceId,
        territoryId,
        userId,
        strength,
        newTotal: newStrength,
      });

      return updated;
    } catch (error) {
      logger.error('Error withdrawing garrison', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Abandon territory
   */
  async abandonTerritory(allianceId, territoryId, userId) {
    try {
      // Check permissions (leader only)
      await this._checkPermission(allianceId, userId, ['leader']);

      // Get territory
      const territory = await this.territoryRepo.getTerritoryById(territoryId);

      if (!territory) {
        const error = new Error('Territory not found');
        error.status = 404;
        throw error;
      }

      if (territory.allianceId !== allianceId) {
        const error = new Error('This territory does not belong to your alliance');
        error.status = 403;
        throw error;
      }

      // Release territory
      await this.territoryRepo.releaseTerritory(territoryId);

      logger.info('Territory abandoned', { allianceId, territoryId, userId });

      return { success: true, message: 'Territory abandoned' };
    } catch (error) {
      logger.error('Error abandoning territory', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Get territories in range (for map display)
   */
  async getTerritoriesInRange(x, y, range) {
    try {
      const territories = await this.territoryRepo.getTerritoriesInRange(x, y, range);

      logger.info('Retrieved territories in range', { x, y, range, count: territories.length });

      return territories;
    } catch (error) {
      logger.error('Error getting territories in range', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate territory bonuses for a user
   */
  async calculateBonuses(userId, allianceId) {
    try {
      const territories = await this.territoryRepo.getAllianceTerritories(allianceId);

      const bonuses = {
        metalProduction: 0,
        energyProduction: 0,
        goldProduction: 0,
        fuelProduction: 0,
        allProduction: 0,
        defense: 0,
      };

      for (const territory of territories) {
        const territoryBonuses = territory.bonuses || {};

        // Accumulate bonuses
        Object.keys(territoryBonuses).forEach((key) => {
          if (bonuses.hasOwnProperty(key)) {
            bonuses[key] += territoryBonuses[key];
          }
        });
      }

      logger.info('Calculated territory bonuses', { userId, allianceId, bonuses });

      return bonuses;
    } catch (error) {
      logger.error('Error calculating territory bonuses', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all territories (for world map)
   */
  async getAllTerritories(options = {}) {
    try {
      const result = await this.territoryRepo.getAllTerritories(options);

      logger.info('Retrieved all territories', { total: result.total });

      return result;
    } catch (error) {
      logger.error('Error getting all territories', { error: error.message });
      throw error;
    }
  }

  /**
   * Check user permission in alliance
   * @private
   */
  async _checkPermission(allianceId, userId, allowedRoles = []) {
    const member = await AllianceMember.findOne({
      where: { userId, allianceId },
    });

    if (!member) {
      const error = new Error('You are not a member of this alliance');
      error.status = 403;
      throw error;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.status = 403;
      throw error;
    }

    return member;
  }
}

module.exports = AllianceTerritoryService;
