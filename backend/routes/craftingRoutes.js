const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

/**
 * Crafting Routes
 * 
 * All routes are prefixed with /api/v1/crafting
 */

module.exports = (craftingController) => {
  // Blueprint routes
  router.get('/blueprints', protect, craftingController.getAllBlueprints);
  router.get('/blueprints/:id', protect, craftingController.getBlueprintById);
  
  // User blueprint routes
  router.get('/user-blueprints', protect, craftingController.getUserBlueprints);
  router.post('/user-blueprints/:blueprintId/grant', protect, craftingController.grantBlueprint);
  
  // Crafting queue routes
  router.post('/craft', protect, craftingController.startCraft);
  router.get('/queue', protect, craftingController.getUserCrafts);
  router.delete('/queue/:id', protect, craftingController.cancelCraft);
  router.post('/queue/:id/speedup', protect, craftingController.speedupCraft);
  router.post('/queue/:id/collect', protect, craftingController.collectCraft);
  
  // Stats & leaderboard routes
  router.get('/stats', protect, craftingController.getUserCraftingStats);
  router.get('/leaderboard', protect, craftingController.getLeaderboard);

  return router;
};
