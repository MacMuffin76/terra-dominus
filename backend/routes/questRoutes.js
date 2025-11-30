// questRoutes.js - Quest system API routes
const express = require('express');
const router = express.Router();

module.exports = (questController) => {
  // Get user's quests
  router.get('/', questController.getAvailableQuests);

  // Get quest statistics
  router.get('/stats', questController.getQuestStats);

  // Assign daily quests
  router.post('/daily/assign', questController.assignDailyQuests);

  // Assign weekly quests
  router.post('/weekly/assign', questController.assignWeeklyQuests);

  // Start a quest
  router.post('/:questId/start', questController.startQuest);

  // Claim quest rewards
  router.post('/:questId/claim', questController.claimRewards);

  // Update quest progress (testing/admin)
  router.post('/:questId/progress', questController.updateProgress);

  return router;
};
