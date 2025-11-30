/**
 * Portal Attempt Repository
 */

class PortalAttemptRepository {
  constructor({ PortalAttempt }) {
    this.PortalAttempt = PortalAttempt;
  }

  /**
   * Create a new portal attempt
   */
  async create(attemptData) {
    return await this.PortalAttempt.create(attemptData);
  }

  /**
   * Find attempts by user
   */
  async findByUser(userId, limit = 20) {
    return await this.PortalAttempt.findAll({
      where: { user_id: userId },
      order: [['attempt_time', 'DESC']],
      limit,
      include: ['portal'],
    });
  }

  /**
   * Find attempts by portal
   */
  async findByPortal(portalId) {
    return await this.PortalAttempt.findAll({
      where: { portal_id: portalId },
      order: [['attempt_time', 'DESC']],
      include: ['user'],
    });
  }

  /**
   * Find user's attempts on specific portal
   */
  async findByUserAndPortal(userId, portalId) {
    return await this.PortalAttempt.findAll({
      where: {
        user_id: userId,
        portal_id: portalId,
      },
      order: [['attempt_time', 'DESC']],
    });
  }

  /**
   * Count user's attempts on portal
   */
  async countUserAttempts(userId, portalId) {
    return await this.PortalAttempt.count({
      where: {
        user_id: userId,
        portal_id: portalId,
      },
    });
  }

  /**
   * Get user's victory count
   */
  async countUserVictories(userId) {
    return await this.PortalAttempt.count({
      where: {
        user_id: userId,
        result: 'victory',
      },
    });
  }

  /**
   * Get user's statistics
   */
  async getUserStats(userId) {
    const { fn, col } = require('sequelize');
    
    const total = await this.PortalAttempt.count({
      where: { user_id: userId },
    });

    const victories = await this.PortalAttempt.count({
      where: { user_id: userId, result: 'victory' },
    });

    const defeats = await this.PortalAttempt.count({
      where: { user_id: userId, result: 'defeat' },
    });

    const retreats = await this.PortalAttempt.count({
      where: { user_id: userId, result: 'retreat' },
    });

    return {
      total,
      victories,
      defeats,
      retreats,
      winRate: total > 0 ? ((victories / total) * 100).toFixed(1) : 0,
    };
  }
}

module.exports = PortalAttemptRepository;
