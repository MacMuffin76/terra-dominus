/**
 * Portal Routes
 * API endpoints for portal system
 */

const express = require('express');
const router = express.Router();

function createPortalRouter({ portalController, authMiddleware, adminMiddleware }) {
  // Public routes (require authentication)
  router.get('/', authMiddleware.protect, portalController.listPortals);
  router.get('/near/:x/:y', authMiddleware.protect, portalController.getPortalsNear);
  router.get('/expeditions', authMiddleware.protect, portalController.getUserExpeditions);
  router.get('/statistics', authMiddleware.protect, portalController.getPortalStatistics);
  router.get('/events', authMiddleware.protect, portalController.getGoldenPortalEvents);
  router.get('/mastery', authMiddleware.protect, portalController.getUserMastery);
  router.get('/history', authMiddleware.protect, portalController.getBattleHistory);
  router.get('/leaderboard/:tier', portalController.getLeaderboard); // Public leaderboard
  router.get('/:id', authMiddleware.protect, portalController.getPortalDetails);
  
  // Attack routes
  router.post('/:id/attack', authMiddleware.protect, portalController.attackPortal);
  router.post('/:id/estimate', authMiddleware.protect, portalController.estimateBattle);
  
  // Admin routes
  router.post('/spawn', authMiddleware.protect, adminMiddleware.adminOnly, portalController.spawnPortal);
  router.get('/stats/spawning', authMiddleware.protect, adminMiddleware.adminOnly, portalController.getSpawningStats);

  return router;
}

module.exports = createPortalRouter;
