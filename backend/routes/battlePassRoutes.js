/**
 * Battle Pass Routes
 * API endpoints for battle pass system
 */

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const createBattlePassRouter = (battlePassController) => {
  const router = express.Router();

  // All routes require authentication
  router.use(authMiddleware.protect);

  // Get active season info
  router.get('/', battlePassController.getActiveSeason);

  // Get user's battle pass progress
  router.get('/progress', battlePassController.getUserProgress);

  // Add XP to battle pass
  router.post('/xp', battlePassController.addXP);

  // Claim specific reward
  router.post('/rewards/:rewardId/claim', battlePassController.claimReward);

  // Claim all available rewards
  router.post('/rewards/claim-all', battlePassController.claimAllRewards);

  // Purchase premium battle pass
  router.post('/premium/purchase', battlePassController.purchasePremium);

  // Get leaderboard
  router.get('/leaderboard', battlePassController.getLeaderboard);

  return router;
};

module.exports = createBattlePassRouter;
