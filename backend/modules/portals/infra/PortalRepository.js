/**
 * PortalRepository
 * Data access layer for Portal entities
 */

const { Portal, PortalExpedition, City, User } = require('../../../models');
const { Op } = require('sequelize');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger({ module: 'PortalRepository' });

class PortalRepository {
  /**
   * Get all active portals (not expired, not cleared)
   * @returns {Promise<Portal[]>}
   */
  async getActivePortals() {
    try {
      const now = new Date();
      return await Portal.findAll({
        where: {
          status: 'active',
          expiry_time: {
            [Op.gt]: now
          }
        },
        order: [['spawn_time', 'DESC']]
      });
    } catch (error) {
      logger.error('Error fetching active portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Get portal by ID
   * @param {number} portalId
   * @returns {Promise<Portal|null>}
   */
  async getPortalById(portalId) {
    try {
      return await Portal.findByPk(portalId);
    } catch (error) {
      logger.error('Error fetching portal by ID', { portalId, error: error.message });
      throw error;
    }
  }

  /**
   * Get portals near coordinates (within radius)
   * @param {number} coordX
   * @param {number} coordY
   * @param {number} radius
   * @returns {Promise<Portal[]>}
   */
  async getPortalsNearCoordinates(coordX, coordY, radius = 50) {
    try {
      const now = new Date();
      return await Portal.findAll({
        where: {
          status: 'active',
          expiry_time: {
            [Op.gt]: now
          },
          x_coordinate: {
            [Op.between]: [coordX - radius, coordX + radius]
          },
          y_coordinate: {
            [Op.between]: [coordY - radius, coordY + radius]
          }
        },
        order: [['spawn_time', 'DESC']]
      });
    } catch (error) {
      logger.error('Error fetching portals near coordinates', { coordX, coordY, radius, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new portal
   * @param {Object} portalData
   * @returns {Promise<Portal>}
   */
  async createPortal(portalData) {
    try {
      return await Portal.create(portalData);
    } catch (error) {
      logger.error('Error creating portal', { portalData, error: error.message });
      throw error;
    }
  }

  /**
   * Update portal
   * @param {number} portalId
   * @param {Object} updates
   * @returns {Promise<Portal>}
   */
  async updatePortal(portalId, updates) {
    try {
      const portal = await Portal.findByPk(portalId);
      if (!portal) {
        throw new Error(`Portal ${portalId} not found`);
      }
      await portal.update(updates);
      return portal;
    } catch (error) {
      logger.error('Error updating portal', { portalId, updates, error: error.message });
      throw error;
    }
  }

  /**
   * Mark portal as cleared
   * @param {number} portalId
   * @returns {Promise<Portal>}
   */
  async markPortalAsCleared(portalId) {
    try {
      return await this.updatePortal(portalId, { 
        status: 'cleared',
        times_cleared: this.sequelize.literal('times_cleared + 1')
      });
    } catch (error) {
      logger.error('Error marking portal as cleared', { portalId, error: error.message });
      throw error;
    }
  }

  /**
   * Increment portal challenge count
   * @param {number} portalId
   * @returns {Promise<Portal>}
   */
  async incrementChallengeCount(portalId) {
    try {
      const portal = await Portal.findByPk(portalId);
      if (!portal) {
        throw new Error(`Portal ${portalId} not found`);
      }
      portal.times_challenged = (portal.times_challenged || 0) + 1;
      await portal.save();
      return portal;
    } catch (error) {
      logger.error('Error incrementing portal challenge count', { portalId, error: error.message });
      throw error;
    }
  }

  /**
   * Expire old portals (update status to 'expired')
   * @returns {Promise<number>} Number of expired portals
   */
  async expireOldPortals() {
    try {
      const now = new Date();
      const [affectedCount] = await Portal.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            expires_at: {
              [Op.lt]: now
            }
          }
        }
      );
      if (affectedCount > 0) {
        logger.info(`Expired ${affectedCount} portals`);
      }
      return affectedCount;
    } catch (error) {
      logger.error('Error expiring old portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user's portal expeditions
   * @param {number} userId
   * @param {string} status - Optional status filter ('traveling', 'victory', 'defeat')
   * @returns {Promise<PortalExpedition[]>}
   */
  async getUserExpeditions(userId, status = null) {
    try {
      const where = { user_id: userId };
      if (status) {
        where.status = status;
      }

      return await PortalExpedition.findAll({
        where,
        include: [
          {
            model: Portal,
            as: 'portal',
            required: true
          },
          {
            model: City,
            as: 'city',
            attributes: ['id', 'name', 'coord_x', 'coord_y']
          }
        ],
        order: [['departure_time', 'DESC']]
      });
    } catch (error) {
      logger.error('Error fetching user expeditions', { userId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Get expedition by ID
   * @param {number} expeditionId
   * @returns {Promise<PortalExpedition|null>}
   */
  async getExpeditionById(expeditionId) {
    try {
      return await PortalExpedition.findByPk(expeditionId, {
        include: [
          {
            model: Portal,
            as: 'portal'
          },
          {
            model: City,
            as: 'city',
            attributes: ['id', 'name', 'coord_x', 'coord_y']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ]
      });
    } catch (error) {
      logger.error('Error fetching expedition by ID', { expeditionId, error: error.message });
      throw error;
    }
  }

  /**
   * Get expeditions arriving before a specific time
   * @param {Date} beforeTime
   * @returns {Promise<PortalExpedition[]>}
   */
  async getExpeditionsArrivingBefore(beforeTime) {
    try {
      return await PortalExpedition.findAll({
        where: {
          status: 'traveling',
          arrival_time: {
            [Op.lte]: beforeTime
          }
        },
        include: [
          {
            model: Portal,
            as: 'portal'
          },
          {
            model: City,
            as: 'city',
            attributes: ['id', 'name', 'coord_x', 'coord_y']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }
        ],
        order: [['arrival_time', 'ASC']]
      });
    } catch (error) {
      logger.error('Error fetching expeditions arriving before time', { beforeTime, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new portal expedition
   * @param {Object} expeditionData
   * @returns {Promise<PortalExpedition>}
   */
  async createExpedition(expeditionData) {
    try {
      return await PortalExpedition.create(expeditionData);
    } catch (error) {
      logger.error('Error creating expedition', { expeditionData, error: error.message });
      throw error;
    }
  }

  /**
   * Update expedition
   * @param {number} expeditionId
   * @param {Object} updates
   * @returns {Promise<PortalExpedition>}
   */
  async updateExpedition(expeditionId, updates) {
    try {
      const expedition = await PortalExpedition.findByPk(expeditionId);
      if (!expedition) {
        throw new Error(`Expedition ${expeditionId} not found`);
      }
      await expedition.update(updates);
      return expedition;
    } catch (error) {
      logger.error('Error updating expedition', { expeditionId, updates, error: error.message });
      throw error;
    }
  }

  /**
   * Count active portals by tier
   * @returns {Promise<Object>} Object with tier counts { GREY: 5, GREEN: 3, ... }
   */
  async countActivePortalsByTier() {
    try {
      const now = new Date();
      const portals = await Portal.findAll({
        where: {
          status: 'active',
          expiry_time: {
            [Op.gt]: now
          }
        },
        attributes: ['tier']
      });

      const counts = {};
      portals.forEach(portal => {
        counts[portal.tier] = (counts[portal.tier] || 0) + 1;
      });

      return counts;
    } catch (error) {
      logger.error('Error counting portals by tier', { error: error.message });
      throw error;
    }
  }

  /**
   * Count portals by tier and status
   * @param {string} tier
   * @param {string} status
   * @returns {Promise<number>}
   */
  async countByTierAndStatus(tier, status) {
    try {
      return await Portal.count({
        where: { tier, status }
      });
    } catch (error) {
      logger.error('Error counting portals by tier and status', { tier, status, error: error.message });
      throw error;
    }
  }

  /**
   * Count portals by tier
   * @param {string} tier
   * @returns {Promise<number>}
   */
  async countByTier(tier) {
    try {
      return await Portal.count({
        where: { tier }
      });
    } catch (error) {
      logger.error('Error counting portals by tier', { tier, error: error.message });
      throw error;
    }
  }

  /**
   * Create portal (alias for createPortal)
   * @param {Object} portalData
   * @returns {Promise<Portal>}
   */
  async create(portalData) {
    return this.createPortal(portalData);
  }

  /**
   * Expire old portals
   * @param {Date} now
   * @returns {Promise<number>} Number of expired portals
   */
  async expirePortals(now) {
    try {
      const [affectedCount] = await Portal.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            expiry_time: {
              [Op.lt]: now
            }
          }
        }
      );
      return affectedCount;
    } catch (error) {
      logger.error('Error expiring portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete expired portals older than cutoff date
   * @param {Date} cutoffDate
   * @returns {Promise<number>} Number of deleted portals
   */
  async deleteExpiredBefore(cutoffDate) {
    try {
      const deletedCount = await Portal.destroy({
        where: {
          status: 'expired',
          expiry_time: {
            [Op.lt]: cutoffDate
          }
        }
      });
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting expired portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Find nearby portals (within collision radius)
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @returns {Promise<Portal[]>}
   */
  async findNearby(x, y, radius = 10) {
    try {
      return await Portal.findAll({
        where: {
          status: 'active',
          x_coordinate: {
            [Op.between]: [x - radius, x + radius]
          },
          y_coordinate: {
            [Op.between]: [y - radius, y + radius]
          }
        }
      });
    } catch (error) {
      logger.error('Error finding nearby portals', { x, y, radius, error: error.message });
      throw error;
    }
  }
}

module.exports = PortalRepository;
