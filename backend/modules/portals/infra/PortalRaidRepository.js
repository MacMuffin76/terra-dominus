/**
 * PortalRaidRepository
 * Data access layer for Alliance Raid entities
 */

const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

class PortalRaidRepository {
  constructor({ models }) {
    this.PortalAllianceRaid = models.PortalAllianceRaid;
    this.PortalRaidParticipant = models.PortalRaidParticipant;
    this.PortalBoss = models.PortalBoss;
    this.Alliance = models.Alliance;
  }

  /**
   * Find raid by ID
   */
  async findById(raidId) {
    try {
      return await this.PortalAllianceRaid.findByPk(raidId, {
        include: [
          { association: 'boss', include: ['portal'] },
          { association: 'alliance' },
          { association: 'participants', include: ['user'] },
        ],
      });
    } catch (error) {
      logger.error('Error finding raid by ID', { raidId, error: error.message });
      throw error;
    }
  }

  /**
   * Get raid by boss ID
   */
  async findByBossId(bossId) {
    try {
      return await this.PortalAllianceRaid.findOne({
        where: { boss_id: bossId },
        include: [
          { association: 'boss' },
          { association: 'alliance' },
          { association: 'participants', include: ['user'] },
        ],
      });
    } catch (error) {
      logger.error('Error finding raid by boss ID', { bossId, error: error.message });
      throw error;
    }
  }

  /**
   * Get active raids for alliance
   */
  async getActiveRaidsForAlliance(allianceId) {
    try {
      return await this.PortalAllianceRaid.findAll({
        where: {
          alliance_id: allianceId,
          status: {
            [Op.in]: ['forming', 'in_progress'],
          },
        },
        include: [
          { association: 'boss', include: ['portal'] },
          { association: 'participants', include: ['user'] },
        ],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching active raids', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get completed raids for alliance
   */
  async getCompletedRaidsForAlliance(allianceId, limit = 20) {
    try {
      return await this.PortalAllianceRaid.findAll({
        where: {
          alliance_id: allianceId,
          status: {
            [Op.in]: ['victory', 'defeat'],
          },
        },
        include: [
          { association: 'boss', include: ['portal'] },
          { association: 'participants', include: ['user'] },
        ],
        order: [['completed_at', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching completed raids', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Create new raid
   */
  async create(raidData) {
    try {
      return await this.PortalAllianceRaid.create(raidData);
    } catch (error) {
      logger.error('Error creating raid', { raidData, error: error.message });
      throw error;
    }
  }

  /**
   * Update raid
   */
  async update(raidId, updates) {
    try {
      const raid = await this.findById(raidId);
      if (!raid) {
        throw new Error('Raid not found');
      }
      return await raid.update(updates);
    } catch (error) {
      logger.error('Error updating raid', { raidId, updates, error: error.message });
      throw error;
    }
  }

  /**
   * Start raid
   */
  async startRaid(raidId) {
    try {
      return await this.update(raidId, {
        status: 'in_progress',
        started_at: new Date(),
      });
    } catch (error) {
      logger.error('Error starting raid', { raidId, error: error.message });
      throw error;
    }
  }

  /**
   * Complete raid
   */
  async completeRaid(raidId, victory, totalDamage, rewardsPool) {
    try {
      return await this.update(raidId, {
        status: victory ? 'victory' : 'defeat',
        total_damage: totalDamage,
        rewards_pool: rewardsPool,
        completed_at: new Date(),
      });
    } catch (error) {
      logger.error('Error completing raid', { raidId, error: error.message });
      throw error;
    }
  }

  /**
   * Add participant to raid
   */
  async addParticipant(raidId, userId, unitsContributed) {
    try {
      return await this.PortalRaidParticipant.create({
        raid_id: raidId,
        user_id: userId,
        units_sent: unitsContributed,
        damage_contributed: 0,
        contribution_percent: 0,
      });
    } catch (error) {
      logger.error('Error adding raid participant', { raidId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update participant contribution
   */
  async updateParticipantContribution(participantId, damageContributed, contributionPercent, unitsLost, rewards) {
    try {
      const participant = await this.PortalRaidParticipant.findByPk(participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }

      return await participant.update({
        damage_contributed: damageContributed,
        contribution_percent: contributionPercent,
        units_lost: unitsLost,
        rewards_earned: rewards,
      });
    } catch (error) {
      logger.error('Error updating participant contribution', { participantId, error: error.message });
      throw error;
    }
  }

  /**
   * Get raid participants
   */
  async getParticipants(raidId) {
    try {
      return await this.PortalRaidParticipant.findAll({
        where: { raid_id: raidId },
        include: [
          {
            association: 'user',
            attributes: ['id', 'username', 'level'],
          },
        ],
        order: [['damage_contributed', 'DESC']],
      });
    } catch (error) {
      logger.error('Error fetching raid participants', { raidId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's raid participation
   */
  async getUserRaids(userId, limit = 10) {
    try {
      return await this.PortalRaidParticipant.findAll({
        where: { user_id: userId },
        include: [
          {
            association: 'raid',
            include: ['boss', 'alliance'],
          },
        ],
        order: [['joined_at', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error fetching user raids', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user is in raid
   */
  async isUserInRaid(raidId, userId) {
    try {
      const participant = await this.PortalRaidParticipant.findOne({
        where: {
          raid_id: raidId,
          user_id: userId,
        },
      });
      return participant !== null;
    } catch (error) {
      logger.error('Error checking user raid participation', { raidId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get raid statistics
   */
  async getRaidStats(allianceId) {
    try {
      const stats = await this.PortalAllianceRaid.findAll({
        where: { alliance_id: allianceId },
        attributes: [
          [this.PortalAllianceRaid.sequelize.fn('COUNT', '*'), 'total_raids'],
          [
            this.PortalAllianceRaid.sequelize.fn(
              'SUM',
              this.PortalAllianceRaid.sequelize.literal("CASE WHEN status = 'victory' THEN 1 ELSE 0 END")
            ),
            'victories',
          ],
          [
            this.PortalAllianceRaid.sequelize.fn(
              'SUM',
              this.PortalAllianceRaid.sequelize.literal("CASE WHEN status = 'defeat' THEN 1 ELSE 0 END")
            ),
            'defeats',
          ],
          [this.PortalAllianceRaid.sequelize.fn('AVG', this.PortalAllianceRaid.sequelize.col('total_damage')), 'avg_damage'],
        ],
        raw: true,
      });

      return stats[0] || null;
    } catch (error) {
      logger.error('Error fetching raid stats', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete old completed raids
   */
  async cleanupOldRaids(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.PortalAllianceRaid.destroy({
        where: {
          status: {
            [Op.in]: ['victory', 'defeat'],
          },
          completed_at: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result} old completed raids`);
      return result;
    } catch (error) {
      logger.error('Error cleaning up old raids', { error: error.message });
      throw error;
    }
  }
}

module.exports = PortalRaidRepository;
