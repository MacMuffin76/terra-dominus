/**
 * PortalBossRepository
 * Data access layer for Portal Boss entities
 */

const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

class PortalBossRepository {
  constructor({ models }) {
    this.PortalBoss = models.PortalBoss;
    this.PortalBossAttempt = models.PortalBossAttempt;
    this.Portal = models.Portal;
  }

  /**
   * Find boss by ID
   */
  async findById(bossId) {
    try {
      return await this.PortalBoss.findByPk(bossId, {
        include: [{ association: 'portal' }],
      });
    } catch (error) {
      logger.error('Error finding boss by ID', { bossId, error: error.message });
      throw error;
    }
  }

  /**
   * Find boss by portal ID
   */
  async findByPortalId(portalId) {
    try {
      return await this.PortalBoss.findOne({
        where: { portal_id: portalId },
        include: [{ association: 'portal' }],
      });
    } catch (error) {
      logger.error('Error finding boss by portal ID', { portalId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all active (not defeated) bosses
   */
  async getActiveBosses() {
    try {
      return await this.PortalBoss.findAll({
        where: { defeated: false },
        include: [
          {
            association: 'portal',
            where: { status: 'active' },
          },
        ],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching active bosses', { error: error.message });
      throw error;
    }
  }

  /**
   * Get bosses by tier
   */
  async getBossesByTier(tier) {
    try {
      return await this.PortalBoss.findAll({
        where: { defeated: false },
        include: [
          {
            association: 'portal',
            where: {
              tier,
              status: 'active',
            },
          },
        ],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching bosses by tier', { tier, error: error.message });
      throw error;
    }
  }

  /**
   * Get bosses by type
   */
  async getBossesByType(bossType) {
    try {
      return await this.PortalBoss.findAll({
        where: {
          boss_type: bossType,
          defeated: false,
        },
        include: [{ association: 'portal' }],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching bosses by type', { bossType, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new boss
   */
  async create(bossData) {
    try {
      return await this.PortalBoss.create(bossData);
    } catch (error) {
      logger.error('Error creating boss', { bossData, error: error.message });
      throw error;
    }
  }

  /**
   * Update boss
   */
  async update(bossId, updates) {
    try {
      const boss = await this.findById(bossId);
      if (!boss) {
        throw new Error('Boss not found');
      }
      return await boss.update(updates);
    } catch (error) {
      logger.error('Error updating boss', { bossId, updates, error: error.message });
      throw error;
    }
  }

  /**
   * Mark boss as defeated
   */
  async markDefeated(bossId, userId) {
    try {
      return await this.update(bossId, {
        defeated: true,
        defeated_by: userId,
        defeated_at: new Date(),
        current_hp: 0,
      });
    } catch (error) {
      logger.error('Error marking boss defeated', { bossId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get defeated bosses (leaderboard)
   */
  async getDefeatedBosses(limit = 50) {
    try {
      return await this.PortalBoss.findAll({
        where: { defeated: true },
        include: [
          { association: 'portal' },
          { association: 'defeatedByUser', attributes: ['id', 'username', 'level'] },
        ],
        order: [['defeated_at', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching defeated bosses', { error: error.message });
      throw error;
    }
  }

  /**
   * Get boss attempts
   */
  async getBossAttempts(bossId, limit = 20) {
    try {
      return await this.PortalBossAttempt.findAll({
        where: { boss_id: bossId },
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'level'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching boss attempts', { bossId, error: error.message });
      throw error;
    }
  }

  /**
   * Record boss attempt
   */
  async recordAttempt(attemptData) {
    try {
      return await this.PortalBossAttempt.create(attemptData);
    } catch (error) {
      logger.error('Error recording boss attempt', { attemptData, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's boss attempts
   */
  async getUserAttempts(userId, limit = 10) {
    try {
      return await this.PortalBossAttempt.findAll({
        where: { user_id: userId },
        include: [
          {
            association: 'boss',
            include: ['portal'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching user boss attempts', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get boss statistics
   */
  async getBossStats(bossId) {
    try {
      const attempts = await this.PortalBossAttempt.findAll({
        where: { boss_id: bossId },
        attributes: [
          [this.PortalBoss.sequelize.fn('COUNT', '*'), 'total_attempts'],
          [
            this.PortalBoss.sequelize.fn(
              'SUM',
              this.PortalBoss.sequelize.literal("CASE WHEN result = 'victory' THEN 1 ELSE 0 END")
            ),
            'victories',
          ],
          [this.PortalBoss.sequelize.fn('AVG', this.PortalBoss.sequelize.col('damage_dealt')), 'avg_damage'],
          [this.PortalBoss.sequelize.fn('MAX', this.PortalBoss.sequelize.col('damage_dealt')), 'max_damage'],
          [this.PortalBoss.sequelize.fn('AVG', this.PortalBoss.sequelize.col('phases_reached')), 'avg_phases'],
        ],
        raw: true,
      });

      return attempts[0] || null;
    } catch (error) {
      logger.error('Error fetching boss stats', { bossId, error: error.message });
      throw error;
    }
  }

  /**
   * Get boss leaderboard (most damage dealt)
   */
  async getBossLeaderboard(bossId, limit = 10) {
    try {
      return await this.PortalBossAttempt.findAll({
        where: { boss_id: bossId },
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'level'],
          },
        ],
        order: [['damage_dealt', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching boss leaderboard', { bossId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete old defeated bosses
   */
  async cleanupOldBosses(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.PortalBoss.destroy({
        where: {
          defeated: true,
          defeated_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result} old defeated bosses`);
      return result;
    } catch (error) {
      logger.error('Error cleaning up old bosses', { error: error.message });
      throw error;
    }
  }
}

module.exports = PortalBossRepository;
