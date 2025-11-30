// achievementController.js - API controller for achievement system
const createAchievementController = ({ achievementService }) => {
  const { logger, runWithContext } = require('../utils/logger');

  /**
   * Get all achievements
   * GET /api/v1/achievements
   */
  const getAllAchievements = async (req, res) => {
    return runWithContext(async () => {
      try {
        const { category, tier } = req.query;

        const filters = {};
        if (category) filters.category = category;
        if (tier) filters.tier = tier;

        const achievements = await achievementService.getAllAchievements(filters);

        res.json({
          success: true,
          achievements
        });

      } catch (error) {
        logger.error('Failed to get achievements:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve achievements',
          error: error.message
        });
      }
    });
  };

  /**
   * Get user's achievements
   * GET /api/v1/achievements/user
   */
  const getUserAchievements = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const { category, unlocked, claimed } = req.query;

        const filters = {};
        if (category) filters.category = category;
        if (unlocked === 'true') filters.unlocked = true;
        else if (unlocked === 'false') filters.unlocked = false;
        if (claimed === 'true') filters.claimed = true;
        else if (claimed === 'false') filters.claimed = false;

        const achievements = await achievementService.getUserAchievements(userId, filters);

        res.json({
          success: true,
          achievements
        });

      } catch (error) {
        logger.error('Failed to get user achievements:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve achievements',
          error: error.message
        });
      }
    });
  };

  /**
   * Claim achievement rewards
   * POST /api/v1/achievements/:achievementId/claim
   */
  const claimRewards = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const achievementId = parseInt(req.params.achievementId, 10);

        if (isNaN(achievementId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid achievement ID'
          });
        }

        const result = await achievementService.claimRewards(userId, achievementId);

        res.json({
          success: true,
          message: 'Rewards claimed successfully',
          ...result
        });

      } catch (error) {
        logger.error('Failed to claim rewards:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to claim rewards'
        });
      }
    });
  };

  /**
   * Get achievement statistics
   * GET /api/v1/achievements/stats
   */
  const getStats = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;

        const stats = await achievementService.getUserAchievementStats(userId);

        res.json({
          success: true,
          stats
        });

      } catch (error) {
        logger.error('Failed to get achievement stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve achievement statistics',
          error: error.message
        });
      }
    });
  };

  /**
   * Get achievement leaderboard
   * GET /api/v1/achievements/leaderboard
   */
  const getLeaderboard = async (req, res) => {
    return runWithContext(async () => {
      try {
        const limit = parseInt(req.query.limit, 10) || 100;

        const leaderboard = await achievementService.getLeaderboard(limit);

        res.json({
          success: true,
          leaderboard
        });

      } catch (error) {
        logger.error('Failed to get leaderboard:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve leaderboard',
          error: error.message
        });
      }
    });
  };

  return {
    getAllAchievements,
    getUserAchievements,
    claimRewards,
    getStats,
    getLeaderboard
  };
};

module.exports = createAchievementController;
