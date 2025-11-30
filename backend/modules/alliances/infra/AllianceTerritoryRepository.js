const { AllianceTerritory, Alliance } = require('../../../models');
const sequelize = require('../../../db');
const { getLogger } = require('../../../utils/logger');
const { Op } = require('sequelize');

const logger = getLogger({ module: 'AllianceTerritoryRepository' });

/**
 * Alliance Territory Repository - Data access layer for territory management
 */
class AllianceTerritoryRepository {
  /**
   * Get all territories controlled by an alliance
   * @param {number} allianceId 
   * @returns {Promise<Array>}
   */
  async getAllianceTerritories(allianceId) {
    try {
      const territories = await AllianceTerritory.findAll({
        where: { allianceId },
        order: [['capturedAt', 'DESC']],
      });

      return territories;
    } catch (error) {
      logger.error('Error fetching alliance territories', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get territory by coordinates
   * @param {number} x 
   * @param {number} y 
   * @returns {Promise<Object|null>}
   */
  async getTerritoryByCoords(x, y) {
    try {
      const territory = await AllianceTerritory.findOne({
        where: { coordX: x, coordY: y },
        include: [
          {
            model: Alliance,
            as: 'alliance',
            attributes: ['id', 'name', 'tag'],
          },
        ],
      });

      return territory;
    } catch (error) {
      logger.error('Error fetching territory by coords', { x, y, error: error.message });
      throw error;
    }
  }

  /**
   * Get territory by ID
   * @param {number} territoryId 
   * @returns {Promise<Object|null>}
   */
  async getTerritoryById(territoryId) {
    try {
      const territory = await AllianceTerritory.findByPk(territoryId, {
        include: [
          {
            model: Alliance,
            as: 'alliance',
            attributes: ['id', 'name', 'tag', 'memberCount'],
          },
        ],
      });

      return territory;
    } catch (error) {
      logger.error('Error fetching territory by ID', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Claim a new territory
   * @param {Object} territoryData 
   * @returns {Promise<Object>}
   */
  async claimTerritory(territoryData) {
    const transaction = await sequelize.transaction();

    try {
      const { allianceId, name, territoryType, coordX, coordY, radius, bonuses } = territoryData;

      // Check if territory already exists at these coordinates
      const existing = await AllianceTerritory.findOne({
        where: { coordX, coordY },
        transaction,
      });

      if (existing) {
        throw new Error('Territory already exists at these coordinates');
      }

      // Create territory
      const territory = await AllianceTerritory.create(
        {
          allianceId,
          name,
          territoryType,
          coordX,
          coordY,
          radius: radius || 5,
          controlPoints: 100,
          bonuses: bonuses || {},
          capturedAt: new Date(),
          defenseLevel: 1,
          garrisonStrength: 0,
        },
        { transaction }
      );

      // Update alliance territories count
      await Alliance.increment('territoriesControlled', {
        by: 1,
        where: { id: allianceId },
        transaction,
      });

      await transaction.commit();

      logger.info('Territory claimed', {
        allianceId,
        territoryId: territory.id,
        coords: { x: coordX, y: coordY },
      });

      return territory;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error claiming territory', { error: error.message });
      throw error;
    }
  }

  /**
   * Upgrade territory defense level
   * @param {number} territoryId 
   * @param {number} newLevel 
   * @returns {Promise<Object>}
   */
  async upgradeTerritoryDefense(territoryId, newLevel) {
    try {
      const territory = await AllianceTerritory.findByPk(territoryId);

      if (!territory) {
        throw new Error('Territory not found');
      }

      if (newLevel <= territory.defenseLevel) {
        throw new Error('New defense level must be higher than current level');
      }

      if (newLevel > 10) {
        throw new Error('Maximum defense level is 10');
      }

      await territory.update({ defenseLevel: newLevel });

      logger.info('Territory defense upgraded', {
        territoryId,
        oldLevel: territory.defenseLevel,
        newLevel,
      });

      return territory;
    } catch (error) {
      logger.error('Error upgrading territory defense', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Update garrison strength
   * @param {number} territoryId 
   * @param {number} strength 
   * @returns {Promise<Object>}
   */
  async updateGarrison(territoryId, strength) {
    try {
      const territory = await AllianceTerritory.findByPk(territoryId);

      if (!territory) {
        throw new Error('Territory not found');
      }

      if (strength < 0) {
        throw new Error('Garrison strength cannot be negative');
      }

      await territory.update({ garrisonStrength: strength });

      logger.info('Territory garrison updated', { territoryId, strength });

      return territory;
    } catch (error) {
      logger.error('Error updating garrison', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Release territory (abandon or lose)
   * @param {number} territoryId 
   * @returns {Promise<void>}
   */
  async releaseTerritory(territoryId) {
    const transaction = await sequelize.transaction();

    try {
      const territory = await AllianceTerritory.findByPk(territoryId, { transaction });

      if (!territory) {
        throw new Error('Territory not found');
      }

      const allianceId = territory.allianceId;

      // Delete territory
      await territory.destroy({ transaction });

      // Update alliance territories count
      await Alliance.decrement('territoriesControlled', {
        by: 1,
        where: { id: allianceId },
        transaction,
      });

      await transaction.commit();

      logger.info('Territory released', { territoryId, allianceId });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error releasing territory', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Get territories in range (spatial query)
   * @param {number} x 
   * @param {number} y 
   * @param {number} range 
   * @returns {Promise<Array>}
   */
  async getTerritoriesInRange(x, y, range) {
    try {
      // Simple distance calculation: |x1 - x2| + |y1 - y2| <= range
      const territories = await AllianceTerritory.findAll({
        where: sequelize.where(
          sequelize.literal(`ABS("coord_x" - ${x}) + ABS("coord_y" - ${y})`),
          '<=',
          range
        ),
        include: [
          {
            model: Alliance,
            as: 'alliance',
            attributes: ['id', 'name', 'tag'],
          },
        ],
      });

      return territories;
    } catch (error) {
      logger.error('Error fetching territories in range', { x, y, range, error: error.message });
      throw error;
    }
  }

  /**
   * Update control points (capture progress)
   * @param {number} territoryId 
   * @param {number} points 
   * @returns {Promise<Object>}
   */
  async updateControlPoints(territoryId, points) {
    try {
      const territory = await AllianceTerritory.findByPk(territoryId);

      if (!territory) {
        throw new Error('Territory not found');
      }

      const newPoints = Math.max(0, Math.min(100, points));
      await territory.update({
        controlPoints: newPoints,
        lastAttack: new Date(),
      });

      logger.info('Territory control points updated', {
        territoryId,
        oldPoints: territory.controlPoints,
        newPoints,
      });

      return territory;
    } catch (error) {
      logger.error('Error updating control points', { territoryId, error: error.message });
      throw error;
    }
  }

  /**
   * Transfer territory ownership (capture)
   * @param {number} territoryId 
   * @param {number} newAllianceId 
   * @returns {Promise<Object>}
   */
  async transferOwnership(territoryId, newAllianceId) {
    const transaction = await sequelize.transaction();

    try {
      const territory = await AllianceTerritory.findByPk(territoryId, { transaction });

      if (!territory) {
        throw new Error('Territory not found');
      }

      const oldAllianceId = territory.allianceId;

      // Update territory ownership
      await territory.update(
        {
          allianceId: newAllianceId,
          controlPoints: 100,
          capturedAt: new Date(),
          garrisonStrength: 0, // Reset garrison
        },
        { transaction }
      );

      // Update old alliance territories count
      await Alliance.decrement('territoriesControlled', {
        by: 1,
        where: { id: oldAllianceId },
        transaction,
      });

      // Update new alliance territories count
      await Alliance.increment('territoriesControlled', {
        by: 1,
        where: { id: newAllianceId },
        transaction,
      });

      await transaction.commit();

      logger.info('Territory ownership transferred', {
        territoryId,
        oldAllianceId,
        newAllianceId,
      });

      return territory;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error transferring territory ownership', {
        territoryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all territories with pagination
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async getAllTerritories(options = {}) {
    try {
      const { limit = 50, offset = 0, territoryType } = options;

      const where = {};
      if (territoryType) {
        where.territoryType = territoryType;
      }

      const { count, rows } = await AllianceTerritory.findAndCountAll({
        where,
        include: [
          {
            model: Alliance,
            as: 'alliance',
            attributes: ['id', 'name', 'tag'],
          },
        ],
        limit,
        offset,
        order: [['capturedAt', 'DESC']],
      });

      return {
        total: count,
        territories: rows,
        limit,
        offset,
      };
    } catch (error) {
      logger.error('Error fetching all territories', { error: error.message });
      throw error;
    }
  }
}

module.exports = AllianceTerritoryRepository;
