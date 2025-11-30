/**
 * Battle Pass Controller
 * Handles HTTP requests for battle pass endpoints
 */

const BattlePassService = require('../modules/battlepass/application/BattlePassService');
const logger = require('../utils/logger');

const createBattlePassController = ({ battlePassService }) => {
  /**
   * GET /api/v1/battlepass
   * Get active season info
   */
  const getActiveSeason = async (req, res) => {
    try {
      const season = await battlePassService.getActiveSeason();
      res.json(season);
    } catch (error) {
      logger.error('Error in getActiveSeason:', error);
      res.status(500).json({ 
        message: 'Failed to get active season',
        error: error.message 
      });
    }
  };

  /**
   * GET /api/v1/battlepass/progress
   * Get user's battle pass progress
   */
  const getUserProgress = async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await battlePassService.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      logger.error('Error in getUserProgress:', error);
      res.status(500).json({ 
        message: 'Failed to get user progress',
        error: error.message 
      });
    }
  };

  /**
   * POST /api/v1/battlepass/xp
   * Add XP to user's battle pass (admin/system use)
   */
  const addXP = async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, source } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid XP amount' });
      }

      const result = await battlePassService.addXP(userId, amount, source || 'manual');
      res.json(result);
    } catch (error) {
      logger.error('Error in addXP:', error);
      res.status(500).json({ 
        message: 'Failed to add XP',
        error: error.message 
      });
    }
  };

  /**
   * POST /api/v1/battlepass/rewards/:rewardId/claim
   * Claim a specific reward
   */
  const claimReward = async (req, res) => {
    try {
      const userId = req.user.id;
      const { rewardId } = req.params;

      if (!rewardId) {
        return res.status(400).json({ message: 'Reward ID is required' });
      }

      const result = await battlePassService.claimReward(userId, parseInt(rewardId));
      res.json({
        message: 'Reward claimed successfully',
        ...result
      });
    } catch (error) {
      logger.error('Error in claimReward:', error);
      
      if (error.message === 'Tier not reached' || 
          error.message === 'Premium battle pass required' ||
          error.message === 'Reward already claimed') {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ 
        message: 'Failed to claim reward',
        error: error.message 
      });
    }
  };

  /**
   * POST /api/v1/battlepass/rewards/claim-all
   * Claim all available rewards
   */
  const claimAllRewards = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await battlePassService.claimAllRewards(userId);
      res.json({
        message: `Claimed ${result.claimed} out of ${result.total} rewards`,
        ...result
      });
    } catch (error) {
      logger.error('Error in claimAllRewards:', error);
      res.status(500).json({ 
        message: 'Failed to claim rewards',
        error: error.message 
      });
    }
  };

  /**
   * POST /api/v1/battlepass/premium/purchase
   * Purchase premium battle pass
   */
  const purchasePremium = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await battlePassService.purchasePremium(userId);
      res.json({
        message: 'Premium battle pass purchased successfully',
        ...result
      });
    } catch (error) {
      logger.error('Error in purchasePremium:', error);
      
      if (error.message === 'Premium already owned') {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ 
        message: 'Failed to purchase premium',
        error: error.message 
      });
    }
  };

  /**
   * GET /api/v1/battlepass/leaderboard
   * Get battle pass leaderboard
   */
  const getLeaderboard = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const leaderboard = await battlePassService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      logger.error('Error in getLeaderboard:', error);
      res.status(500).json({ 
        message: 'Failed to get leaderboard',
        error: error.message 
      });
    }
  };

  return {
    getActiveSeason,
    getUserProgress,
    addXP,
    claimReward,
    claimAllRewards,
    purchasePremium,
    getLeaderboard
  };
};

module.exports = createBattlePassController;
