// questController.js - API controller for quest system
const createQuestController = ({ questService }) => {
  const logger = require('../utils/logger');
  const { runWithContext } = require('../utils/logger');

  /**
   * Get available quests
   * GET /api/v1/quests
   */
  const getAvailableQuests = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const { type, status } = req.query;

        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;

        const quests = await questService.getUserQuests(userId, filters);

        res.json({
          success: true,
          quests
        });

      } catch (error) {
        logger.error('Failed to get quests:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve quests',
          error: error.message
        });
      }
    });
  };

  /**
   * Assign daily quests to user
   * POST /api/v1/quests/daily/assign
   */
  const assignDailyQuests = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;

        const quests = await questService.assignDailyQuests(userId);

        res.json({
          success: true,
          message: `Assigned ${quests.length} daily quests`,
          quests
        });

      } catch (error) {
        logger.error('Failed to assign daily quests:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to assign daily quests',
          error: error.message
        });
      }
    });
  };

  /**
   * Assign weekly quests to user
   * POST /api/v1/quests/weekly/assign
   */
  const assignWeeklyQuests = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;

        const quests = await questService.assignWeeklyQuests(userId);

        res.json({
          success: true,
          message: `Assigned ${quests.length} weekly quests`,
          quests
        });

      } catch (error) {
        logger.error('Failed to assign weekly quests:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to assign weekly quests',
          error: error.message
        });
      }
    });
  };

  /**
   * Start a quest
   * POST /api/v1/quests/:questId/start
   */
  const startQuest = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const questId = parseInt(req.params.questId, 10);

        if (isNaN(questId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid quest ID'
          });
        }

        const userQuest = await questService.startQuest(userId, questId);

        res.json({
          success: true,
          message: 'Quest started',
          userQuest
        });

      } catch (error) {
        logger.error('Failed to start quest:', error);
        res.status(400).json({
          success: false,
          message: error.message || 'Failed to start quest'
        });
      }
    });
  };

  /**
   * Claim quest rewards
   * POST /api/v1/quests/:questId/claim
   */
  const claimRewards = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const questId = parseInt(req.params.questId, 10);

        if (isNaN(questId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid quest ID'
          });
        }

        const result = await questService.claimRewards(userId, questId);

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
   * Get quest statistics
   * GET /api/v1/quests/stats
   */
  const getQuestStats = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;

        const stats = await questService.getUserQuestStats(userId);

        res.json({
          success: true,
          stats
        });

      } catch (error) {
        logger.error('Failed to get quest stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve quest statistics',
          error: error.message
        });
      }
    });
  };

  /**
   * Manual progress update (for testing/admin)
   * POST /api/v1/quests/:questId/progress
   */
  const updateProgress = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const questId = parseInt(req.params.questId, 10);
        const { increment } = req.body;

        if (isNaN(questId) || !increment || increment <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid quest ID or increment'
          });
        }

        const userQuest = await questService.updateQuestProgress(userId, questId, increment);

        if (!userQuest) {
          return res.status(404).json({
            success: false,
            message: 'Quest not found or cannot be updated'
          });
        }

        res.json({
          success: true,
          message: 'Progress updated',
          userQuest
        });

      } catch (error) {
        logger.error('Failed to update progress:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update progress',
          error: error.message
        });
      }
    });
  };

  return {
    getAvailableQuests,
    assignDailyQuests,
    assignWeeklyQuests,
    startQuest,
    claimRewards,
    getQuestStats,
    updateProgress
  };
};

module.exports = createQuestController;
