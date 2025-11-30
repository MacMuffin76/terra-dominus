const { Alliance, AllianceTreasuryLog, AllianceMember } = require('../../../models');
const { getLogger } = require('../../../utils/logger');
const sequelize = require('../../../db');

const logger = getLogger({ module: 'AllianceTreasuryRepository' });

/**
 * Alliance Treasury Repository - Data access for treasury operations
 */
class AllianceTreasuryRepository {
  /**
   * Get alliance treasury balances
   * @param {number} allianceId 
   * @returns {Promise<Object>}
   */
  async getTreasuryBalances(allianceId) {
    try {
      const alliance = await Alliance.findByPk(allianceId, {
        attributes: ['id', 'treasuryGold', 'treasuryMetal', 'treasuryFuel', 'treasuryEnergy'],
      });

      if (!alliance) {
        throw new Error('Alliance not found');
      }

      return {
        gold: parseInt(alliance.treasuryGold) || 0,
        metal: parseInt(alliance.treasuryMetal) || 0,
        fuel: parseInt(alliance.treasuryFuel) || 0,
        energy: parseInt(alliance.treasuryEnergy) || 0,
      };
    } catch (error) {
      logger.error('Error fetching treasury balances', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Update treasury balance (with transaction logging)
   * @param {number} allianceId 
   * @param {string} resourceType - 'gold', 'metal', 'fuel', or 'energy'
   * @param {number} amount - Positive for deposit, negative for withdraw
   * @param {string} transactionType 
   * @param {number|null} userId 
   * @param {string} reason 
   * @param {Object} metadata 
   * @param {Object|null} externalTransaction - Optional external transaction
   * @returns {Promise<Object>}
   */
  async updateTreasuryBalance(
    allianceId,
    resourceType,
    amount,
    transactionType,
    userId = null,
    reason = '',
    metadata = {},
    externalTransaction = null
  ) {
    const executeInTransaction = async (t) => {
      // Get current balance
      const alliance = await Alliance.findByPk(allianceId, { transaction: t });

      if (!alliance) {
        throw new Error('Alliance not found');
      }

      const fieldMap = {
        gold: 'treasuryGold',
        metal: 'treasuryMetal',
        fuel: 'treasuryFuel',
        energy: 'treasuryEnergy',
      };

      const field = fieldMap[resourceType];
      if (!field) {
        throw new Error(`Invalid resource type: ${resourceType}`);
      }

      const balanceBefore = parseInt(alliance[field]) || 0;
      const balanceAfter = balanceBefore + amount;

      if (balanceAfter < 0) {
        throw new Error(`Insufficient ${resourceType} in treasury`);
      }

      // Update alliance treasury
      await alliance.update({ [field]: balanceAfter }, { transaction: t });

      // Log transaction
      const log = await AllianceTreasuryLog.create(
        {
          allianceId,
          userId,
          transactionType,
          resourceType,
          amount,
          balanceBefore,
          balanceAfter,
          reason,
          metadata,
        },
        { transaction: t }
      );

      logger.info('Treasury transaction', {
        allianceId,
        resourceType,
        amount,
        transactionType,
        balanceAfter,
      });

      return {
        balanceBefore,
        balanceAfter,
        amount,
        log,
      };
    };

    if (externalTransaction) {
      return executeInTransaction(externalTransaction);
    } else {
      const transaction = await sequelize.transaction();
      try {
        const result = await executeInTransaction(transaction);
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback();
        logger.error('Error updating treasury', {
          allianceId,
          resourceType,
          amount,
          error: error.message,
        });
        throw error;
      }
    }
  }

  /**
   * Get treasury transaction history
   * @param {number} allianceId 
   * @param {Object} filters 
   * @returns {Promise<Array>}
   */
  async getTransactionHistory(allianceId, filters = {}) {
    try {
      const where = { allianceId };

      if (filters.transactionType) {
        where.transactionType = filters.transactionType;
      }

      if (filters.resourceType) {
        where.resourceType = filters.resourceType;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      const logs = await AllianceTreasuryLog.findAll({
        where,
        include: [
          {
            model: require('../../../models').User,
            as: 'user',
            attributes: ['id', 'username'],
          },
        ],
        order: [[sequelize.col('created_at'), 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      return logs;
    } catch (error) {
      logger.error('Error fetching transaction history', { allianceId, error: error.message });
      throw error;
    }
  }

  /**
   * Get member contributions (deposits)
   * @param {number} allianceId 
   * @returns {Promise<Array>}
   */
  async getMemberContributions(allianceId) {
    try {
      const contributions = await AllianceTreasuryLog.findAll({
        attributes: [
          'userId',
          'resourceType',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        ],
        where: {
          allianceId,
          transactionType: 'deposit',
        },
        group: ['userId', 'resourceType', 'user.id'],
        include: [
          {
            model: require('../../../models').User,
            as: 'user',
            attributes: ['id', 'username'],
          },
        ],
      });

      return contributions;
    } catch (error) {
      logger.error('Error fetching member contributions', { allianceId, error: error.message });
      throw error;
    }
  }
}

module.exports = AllianceTreasuryRepository;
