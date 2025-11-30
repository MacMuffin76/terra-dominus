/**
 * Portal Quest Routes
 * API endpoints for quest system
 */

const express = require('express');
const router = express.Router();

module.exports = (container) => {
  const controller = container.resolve('portalQuestController');
  const { protect } = require('../../../middleware/authMiddleware');

  // ============================================
  // PUBLIC QUEST DISCOVERY
  // ============================================

  // Get available quests for user
  router.get('/available', protect, controller.getAvailableQuests);

  // Get daily quests
  router.get('/daily', protect, controller.getDailyQuests);

  // Get story progress
  router.get('/story', protect, controller.getStoryProgress);

  // ============================================
  // QUEST LIFECYCLE
  // ============================================

  // Accept a quest
  router.post('/:questId/accept', protect, controller.acceptQuest);

  // Abandon a quest
  router.post('/:questId/abandon', protect, controller.abandonQuest);

  // Claim quest rewards
  router.post('/:questId/claim', protect, controller.claimRewards);

  // ============================================
  // USER QUEST STATUS
  // ============================================

  // Get active quests
  router.get('/user/active', protect, controller.getActiveQuests);

  // Get quest statistics
  router.get('/user/stats', protect, controller.getQuestStats);

  // ============================================
  // UNLOCKS
  // ============================================

  // Get all user unlocks
  router.get('/unlocks', protect, controller.getUserUnlocks);

  // Check specific unlock
  router.get('/unlocks/check', protect, controller.checkUnlock);

  // ============================================
  // STREAKS
  // ============================================

  // Get user streak
  router.get('/streak', protect, controller.getStreak);

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // Manually trigger daily quest rotation (admin only)
  router.post('/admin/rotate-daily', protect, controller.rotateDailyQuests);

  return router;
};
