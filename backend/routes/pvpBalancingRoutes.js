/**
 * PvP Balancing Routes
 * API endpoints for matchmaking, power calculation, and fairness checks
 */

const express = require('express');
const router = express.Router();

module.exports = (controller, authMiddleware) => {
  const { protect } = authMiddleware;

  /**
   * @route   GET /api/v1/pvp/power/me
   * @desc    Get current user's power score
   * @access  Protected
   */
  router.get('/power/me', protect, controller.getMyPower);

  /**
   * @route   GET /api/v1/pvp/power/me/breakdown
   * @desc    Get detailed power breakdown for current user
   * @access  Protected
   */
  router.get('/power/me/breakdown', protect, controller.getMyPowerBreakdown);

  /**
   * @route   GET /api/v1/pvp/power/:userId
   * @desc    Get player power score by user ID
   * @query   refresh - Force refresh cache (true/false)
   * @access  Protected
   */
  router.get('/power/:userId', protect, controller.getPlayerPower);

  /**
   * @route   GET /api/v1/pvp/matchmaking/fairness/:targetUserId
   * @desc    Check fairness of attacking a specific target
   * @access  Protected
   */
  router.get('/matchmaking/fairness/:targetUserId', protect, controller.checkMatchFairness);

  /**
   * @route   POST /api/v1/pvp/matchmaking/suggest
   * @desc    Get suggested targets based on current user's power
   * @body    { excludeUserIds: number[], limit: number }
   * @access  Protected
   */
  router.post('/matchmaking/suggest', protect, controller.suggestTargets);

  /**
   * @route   POST /api/v1/pvp/attack/estimate-cost
   * @desc    Estimate attack cost with PvP balancing
   * @body    { targetUserId: number, units: object, distance: number }
   * @access  Protected
   */
  router.post('/attack/estimate-cost', protect, controller.estimateAttackCost);

  return router;
};
