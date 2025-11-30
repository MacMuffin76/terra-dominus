/**
 * Portal Quest Controller
 * Handles HTTP requests for quest system
 */

const { getLogger, runWithContext } = require('../utils/logger');
const logger = getLogger();

module.exports = ({ questService }) => {
  return {
    // ============================================
    // QUEST DISCOVERY
    // ============================================

    async getAvailableQuests(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;
          const userLevel = req.user.level || 1;
          const masteryTier = req.user.mastery_tier || 0;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/available');

          const quests = await questService.getAvailableQuests(userId, userLevel, masteryTier);

          res.status(200).json({
            success: true,
            quests,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting available quests');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    async getDailyQuests(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/daily');

          const quests = await questService.getDailyQuests(userId);

          res.status(200).json({
            success: true,
            quests,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting daily quests');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    async getStoryProgress(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/story');

          const progress = await questService.getStoryProgress(userId);
          const currentChapter = await questService.getCurrentChapter(userId);
          const nextQuest = await questService.getNextStoryQuest(userId);

          res.status(200).json({
            success: true,
            progress,
            currentChapter,
            nextQuest,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting story progress');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    // ============================================
    // QUEST LIFECYCLE
    // ============================================

    async acceptQuest(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;
          const { questId } = req.params;

          logger.info({ traceId, userId, questId }, 'POST /api/v1/portal-quests/:questId/accept');

          const userQuest = await questService.acceptQuest(userId, parseInt(questId));

          res.status(200).json({
            success: true,
            message: 'Quest accepted',
            userQuest,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error accepting quest');
          res.status(400).json({ success: false, message: error.message });
        }
      });
    },

    async abandonQuest(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;
          const { questId } = req.params;

          logger.info({ traceId, userId, questId }, 'POST /api/v1/portal-quests/:questId/abandon');

          const userQuest = await questService.abandonQuest(userId, parseInt(questId));

          res.status(200).json({
            success: true,
            message: 'Quest abandoned',
            userQuest,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error abandoning quest');
          res.status(400).json({ success: false, message: error.message });
        }
      });
    },

    async claimRewards(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;
          const { questId } = req.params;

          logger.info({ traceId, userId, questId }, 'POST /api/v1/portal-quests/:questId/claim');

          const result = await questService.claimRewards(userId, parseInt(questId));

          res.status(200).json({
            success: true,
            message: 'Rewards claimed',
            rewards: result.rewards,
            streakBonus: result.streakBonus,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error claiming rewards');
          res.status(400).json({ success: false, message: error.message });
        }
      });
    },

    // ============================================
    // USER QUEST STATUS
    // ============================================

    async getActiveQuests(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/user/active');

          const { findActiveUserQuests } = questService.questRepository || require('../modules/quests/infra/QuestRepository')({ 
            models: require('../models'), 
            logger, 
            traceId 
          });

          const quests = await findActiveUserQuests(userId);

          res.status(200).json({
            success: true,
            quests: quests.map(q => q.getSummary()),
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting active quests');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    async getQuestStats(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/user/stats');

          const stats = await questService.getUserQuestStats(userId);

          res.status(200).json({
            success: true,
            stats,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting quest stats');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    // ============================================
    // UNLOCKS
    // ============================================

    async getUserUnlocks(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/unlocks');

          const unlocks = await questService.getUserUnlocks(userId);

          res.status(200).json({
            success: true,
            unlocks: unlocks.map(u => u.getUnlockDetails()),
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting unlocks');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    async checkUnlock(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;
          const { unlockType, unlockKey } = req.query;

          if (!unlockType || !unlockKey) {
            return res.status(400).json({
              success: false,
              message: 'unlockType and unlockKey are required',
            });
          }

          logger.info({ traceId, userId, unlockType, unlockKey }, 'GET /api/v1/portal-quests/unlocks/check');

          const hasUnlock = await questService.hasUnlock(userId, unlockType, unlockKey);

          res.status(200).json({
            success: true,
            unlocked: hasUnlock,
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error checking unlock');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    // ============================================
    // STREAKS
    // ============================================

    async getStreak(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          const userId = req.user.id;

          logger.info({ traceId, userId }, 'GET /api/v1/portal-quests/streak');

          const streak = await questService.getStreak(userId);

          res.status(200).json({
            success: true,
            streak: streak.getSummary(),
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error getting streak');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    async rotateDailyQuests(req, res) {
      await runWithContext(req, async (traceId) => {
        try {
          logger.info({ traceId }, 'POST /api/v1/portal-quests/admin/rotate-daily');

          const rotation = await questService.rotateDailyQuests();

          res.status(200).json({
            success: true,
            message: 'Daily quests rotated',
            rotation: rotation.getSummary(),
          });
        } catch (error) {
          logger.error({ traceId: req.traceId, error: error.message }, 'Error rotating daily quests');
          res.status(500).json({ success: false, message: error.message });
        }
      });
    },
  };
};
