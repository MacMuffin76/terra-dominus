/**
 * Portal Boss Routes
 * API endpoints for boss battles and alliance raids
 */

const express = require('express');
const router = express.Router();

function createPortalBossRouter({ portalBossController, authMiddleware, adminMiddleware }) {
  // Boss listing and details
  router.get('/bosses', authMiddleware.protect, portalBossController.listActiveBosses);
  router.get('/bosses/:bossId', authMiddleware.protect, portalBossController.getBossDetails);
  router.get('/bosses/:bossId/attempts', authMiddleware.protect, portalBossController.getBossAttempts);
  router.get('/bosses/:bossId/leaderboard', authMiddleware.protect, portalBossController.getBossLeaderboard);
  
  // Boss combat
  router.post('/bosses/:bossId/attack', authMiddleware.protect, portalBossController.attackBoss);
  router.post('/bosses/:bossId/estimate', authMiddleware.protect, portalBossController.estimateBossBattle);
  
  // User boss history
  router.get('/user/boss-attempts', authMiddleware.protect, portalBossController.getUserBossAttempts);
  
  // Alliance raids
  router.get('/raids', authMiddleware.protect, portalBossController.listAllianceRaids);
  router.get('/raids/:raidId', authMiddleware.protect, portalBossController.getRaidDetails);
  router.post('/raids/create', authMiddleware.protect, portalBossController.createRaid);
  router.post('/raids/:raidId/join', authMiddleware.protect, portalBossController.joinRaid);
  router.post('/raids/:raidId/start', authMiddleware.protect, portalBossController.startRaid);
  router.get('/raids/:raidId/participants', authMiddleware.protect, portalBossController.getRaidParticipants);
  
  // Admin routes
  router.post('/admin/spawn-boss', authMiddleware.protect, adminMiddleware.adminOnly, portalBossController.spawnBoss);
  router.delete('/admin/bosses/:bossId', authMiddleware.protect, adminMiddleware.adminOnly, portalBossController.deleteBoss);

  return router;
}

module.exports = createPortalBossRouter;
