const AllianceTreasuryRepository = require('../infra/AllianceTreasuryRepository');
const AllianceMember = require('../../../models/AllianceMember');
const ResourceService = require('../../resources/application/ResourceService');
const { getLogger } = require('../../../utils/logger');
const sequelize = require('../../../db');

const logger = getLogger({ module: 'AllianceTreasuryService' });

/**
 * Alliance Treasury Service - Business logic for alliance treasury
 */
class AllianceTreasuryService {
  constructor() {
    this.treasuryRepo = new AllianceTreasuryRepository();
    this.resourceService = new ResourceService();
  }

  /**
   * Deposit resources into alliance treasury
   * @param {number} allianceId 
   * @param {number} userId 
   * @param {Object} resources - { gold: 1000, metal: 500, ... }
   * @returns {Promise<Object>}
   */
  async depositResources(allianceId, userId, resources) {
    try {
      // Verify user is member
      await this._checkMembership(allianceId, userId);

      const transaction = await sequelize.transaction();
      const results = [];

      try {
        // Deduct resources from user's city using ResourceService
        await this.resourceService.deductResourcesFromUser(userId, resources, transaction);

        // Add to alliance treasury for each resource type
        for (const [resourceType, amount] of Object.entries(resources)) {
          if (amount <= 0) continue;

          const result = await this.treasuryRepo.updateTreasuryBalance(
            allianceId,
            resourceType,
            amount,
            'deposit',
            userId,
            `Deposit by member`,
            {},
            transaction
          );

          results.push({ resourceType, ...result });
        }

        // Update member contribution
        await AllianceMember.increment('contribution', {
          by: this._calculateContributionValue(resources),
          where: { allianceId, userId },
          transaction,
        });

        await transaction.commit();

        logger.info('Resources deposited', { allianceId, userId, resources });

        return {
          success: true,
          deposits: results,
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error depositing resources', { allianceId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Withdraw resources from alliance treasury (officers/leader only)
   * @param {number} allianceId 
   * @param {number} userId 
   * @param {string} recipientUserId 
   * @param {Object} resources 
   * @param {string} reason 
   * @returns {Promise<Object>}
   */
  async withdrawResources(allianceId, userId, recipientUserId, resources, reason = '') {
    try {
      // Verify permissions (officer or leader)
      await this._checkPermission(allianceId, userId, ['leader', 'officer']);

      // Verify recipient is member
      const recipient = await AllianceMember.findOne({
        where: { allianceId, userId: recipientUserId },
      });

      if (!recipient) {
        throw new Error('Recipient is not a member of this alliance');
      }

      const transaction = await sequelize.transaction();
      const results = [];

      try {
        // Withdraw from alliance treasury for each resource type
        for (const [resourceType, amount] of Object.entries(resources)) {
          if (amount <= 0) continue;

          const result = await this.treasuryRepo.updateTreasuryBalance(
            allianceId,
            resourceType,
            -amount,
            'withdraw',
            userId,
            reason || `Withdrawal for member`,
            { recipientUserId },
            transaction
          );

          results.push({ resourceType, ...result });
        }

        // Add resources to recipient's city using ResourceService
        await this.resourceService.addResourcesToUser(recipientUserId, resources, transaction);

        await transaction.commit();

        logger.info('Resources withdrawn', { allianceId, userId, recipientUserId, resources });

        return {
          success: true,
          withdrawals: results,
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error withdrawing resources', { allianceId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get treasury balances
   * @param {number} allianceId 
   * @returns {Promise<Object>}
   */
  async getTreasuryBalances(allianceId) {
    return await this.treasuryRepo.getTreasuryBalances(allianceId);
  }

  /**
   * Get transaction history
   * @param {number} allianceId 
   * @param {Object} filters 
   * @returns {Promise<Array>}
   */
  async getTransactionHistory(allianceId, filters = {}) {
    return await this.treasuryRepo.getTransactionHistory(allianceId, filters);
  }

  /**
   * Get member contributions leaderboard
   * @param {number} allianceId 
   * @returns {Promise<Array>}
   */
  async getMemberContributions(allianceId) {
    return await this.treasuryRepo.getMemberContributions(allianceId);
  }

  /**
   * Collect tax from members (automated job)
   * @param {number} allianceId 
   * @param {number} taxRate - Percentage (0-100)
   * @returns {Promise<Object>}
   */
  async collectTax(allianceId, taxRate = 5) {
    try {
      if (taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }

      const members = await AllianceMember.findAll({
        where: { allianceId },
        include: [{ model: require('../../../models').User, as: 'user' }],
      });

      const results = [];

      for (const member of members) {
        // TODO: Calculate tax based on member's production
        // For now, this is a placeholder
      }

      return { success: true, taxCollected: results };
    } catch (error) {
      logger.error('Error collecting tax', { allianceId, error: error.message });
      throw error;
    }
  }

  // ===== PRIVATE HELPERS =====

  async _checkMembership(allianceId, userId) {
    const member = await AllianceMember.findOne({
      where: { allianceId, userId },
      include: [{ model: require('../../../models').User, as: 'user', attributes: ['id', 'username'] }],
    });

    if (!member) {
      throw new Error('You are not a member of this alliance');
    }

    return member;
  }

  async _checkPermission(allianceId, userId, allowedRoles) {
    const member = await this._checkMembership(allianceId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new Error('Insufficient permissions');
    }

    return member;
  }

  _calculateContributionValue(resources) {
    // Simple contribution score: 1 point per resource unit
    // Can be weighted differently (e.g., rare resources worth more)
    return Object.values(resources).reduce((sum, amount) => sum + amount, 0);
  }
}

module.exports = AllianceTreasuryService;
