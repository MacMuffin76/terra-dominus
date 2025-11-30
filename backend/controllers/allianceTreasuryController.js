const AllianceTreasuryService = require('../modules/alliances/application/AllianceTreasuryService');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'AllianceTreasuryController' });

/**
 * Alliance Treasury Controller - HTTP endpoints for treasury management
 */

/**
 * GET /api/v1/alliances/:allianceId/treasury
 * Get current treasury balances
 */
exports.getTreasuryBalances = async (req, res) => {
  try {
    const { allianceId } = req.params;
    const userId = req.user.id;

    const treasuryService = new AllianceTreasuryService();
    const balances = await treasuryService.getTreasuryBalances(parseInt(allianceId));

    res.status(200).json({
      success: true,
      treasury: balances,
    });
  } catch (error) {
    logger.error('Error getting treasury balances', { error: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get treasury balances',
    });
  }
};

/**
 * POST /api/v1/alliances/:allianceId/treasury/deposit
 * Deposit resources into alliance treasury
 * Body: { gold: 1000, metal: 500, fuel: 200, energy: 100 }
 */
exports.depositResources = async (req, res) => {
  try {
    const { allianceId } = req.params;
    const userId = req.user.id;
    const resources = req.body;

    // Validate resources object
    if (!resources || typeof resources !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resources format. Expected object with gold, metal, fuel, energy.',
      });
    }

    // Validate at least one resource is being deposited
    const resourceTypes = ['gold', 'metal', 'fuel', 'energy'];
    const hasValidResource = resourceTypes.some((type) => {
      const amount = parseInt(resources[type]);
      return !isNaN(amount) && amount > 0;
    });

    if (!hasValidResource) {
      return res.status(400).json({
        success: false,
        message: 'At least one resource with positive amount is required.',
      });
    }

    // Convert string values to numbers and filter valid resources
    const validResources = {};
    resourceTypes.forEach((type) => {
      const amount = parseInt(resources[type]);
      if (!isNaN(amount) && amount > 0) {
        validResources[type] = amount;
      }
    });

    const treasuryService = new AllianceTreasuryService();
    const result = await treasuryService.depositResources(
      parseInt(allianceId),
      userId,
      validResources
    );

    res.status(200).json({
      success: true,
      message: 'Resources deposited successfully',
      deposits: result.deposits,
    });
  } catch (error) {
    logger.error('Error depositing resources', { error: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to deposit resources',
    });
  }
};

/**
 * POST /api/v1/alliances/:allianceId/treasury/withdraw
 * Withdraw resources from alliance treasury (officers/leader only)
 * Body: { recipientUserId: 123, resources: { gold: 1000, metal: 500 }, reason: 'Reward' }
 */
exports.withdrawResources = async (req, res) => {
  try {
    const { allianceId } = req.params;
    const userId = req.user.id;
    const { recipientUserId, resources, reason } = req.body;

    // Validate request body
    if (!recipientUserId) {
      return res.status(400).json({
        success: false,
        message: 'recipientUserId is required',
      });
    }

    if (!resources || typeof resources !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resources format. Expected object with gold, metal, fuel, energy.',
      });
    }

    // Validate at least one resource is being withdrawn
    const resourceTypes = ['gold', 'metal', 'fuel', 'energy'];
    const hasValidResource = resourceTypes.some((type) => {
      const amount = parseInt(resources[type]);
      return !isNaN(amount) && amount > 0;
    });

    if (!hasValidResource) {
      return res.status(400).json({
        success: false,
        message: 'At least one resource with positive amount is required.',
      });
    }

    // Convert string values to numbers and filter valid resources
    const validResources = {};
    resourceTypes.forEach((type) => {
      const amount = parseInt(resources[type]);
      if (!isNaN(amount) && amount > 0) {
        validResources[type] = amount;
      }
    });

    const treasuryService = new AllianceTreasuryService();
    const result = await treasuryService.withdrawResources(
      parseInt(allianceId),
      userId,
      parseInt(recipientUserId),
      validResources,
      reason || ''
    );

    res.status(200).json({
      success: true,
      message: 'Resources withdrawn successfully',
      withdrawals: result.withdrawals,
    });
  } catch (error) {
    logger.error('Error withdrawing resources', { error: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to withdraw resources',
    });
  }
};

/**
 * GET /api/v1/alliances/:allianceId/treasury/history
 * Get treasury transaction history
 * Query params: transactionType, resourceType, userId, limit, offset
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const { allianceId } = req.params;
    const { transactionType, resourceType, userId: filterUserId, limit, offset } = req.query;

    const filters = {};
    if (transactionType) filters.transactionType = transactionType;
    if (resourceType) filters.resourceType = resourceType;
    if (filterUserId) filters.userId = parseInt(filterUserId);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const treasuryService = new AllianceTreasuryService();
    const history = await treasuryService.getTransactionHistory(parseInt(allianceId), filters);

    res.status(200).json({
      success: true,
      count: history.length,
      transactions: history,
    });
  } catch (error) {
    logger.error('Error getting transaction history', { error: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get transaction history',
    });
  }
};

/**
 * GET /api/v1/alliances/:allianceId/treasury/contributions
 * Get member contributions (leaderboard)
 */
exports.getMemberContributions = async (req, res) => {
  try {
    const { allianceId } = req.params;

    const treasuryService = new AllianceTreasuryService();
    const contributions = await treasuryService.getMemberContributions(parseInt(allianceId));

    res.status(200).json({
      success: true,
      count: contributions.length,
      contributions,
    });
  } catch (error) {
    logger.error('Error getting member contributions', { error: error.message });
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to get member contributions',
    });
  }
};
