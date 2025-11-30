// achievementRoutes.js - Achievement system API routes
const express = require('express');
const router = express.Router();

module.exports = (achievementController) => {
  // Get all achievements
  router.get('/', achievementController.getAllAchievements);

  // Get user's achievements
  router.get('/user', achievementController.getUserAchievements);

  // Get achievement statistics
  router.get('/stats', achievementController.getStats);

  // Get leaderboard
  router.get('/leaderboard', achievementController.getLeaderboard);

  // Claim achievement rewards
  router.post('/:achievementId/claim', achievementController.claimRewards);

  return router;
};
