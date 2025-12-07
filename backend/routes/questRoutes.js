// questRoutes.js - Quest system API routes
const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const createQuestRouter = (questController) => {
  const router = express.Router();

  // Get user's quests
  router.get('/', protect, questController.getAvailableQuests);

  // Get quest statistics
  router.get('/stats', protect, questController.getQuestStats);

  // Assign daily quests
  router.post('/daily/assign', protect, questController.assignDailyQuests);

  // Assign weekly quests
  router.post('/weekly/assign', protect, questController.assignWeeklyQuests);

  // Start a quest
  router.post('/:questId/start', protect, questController.startQuest);

  // Claim quest rewards
  router.post('/:questId/claim', protect, questController.claimRewards);

  // Update quest progress (testing/admin)
  router.post('/:questId/progress', protect, questController.updateProgress);

  return router;
};

module.exports = createQuestRouter;
