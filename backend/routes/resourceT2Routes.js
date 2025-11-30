const express = require('express');

/**
 * Create Resource T2 Router
 * @param {object} dependencies - { resourceT2Controller, authMiddleware }
 * @returns {express.Router}
 */
function createResourceT2Router({ resourceT2Controller, authMiddleware }) {
  const router = express.Router();

  // All routes require authentication
  router.use(authMiddleware.protect);

  /**
   * GET /api/v1/resources/t2
   * Get user's T2 resources
   */
  router.get('/', resourceT2Controller.getUserResources);

  /**
   * GET /api/v1/resources/t2/recipes
   * Get all available conversion recipes
   */
  router.get('/recipes', resourceT2Controller.getRecipes);

  /**
   * POST /api/v1/resources/t2/convert
   * Start a resource conversion
   * Body: { resourceType, quantity }
   */
  router.post('/convert', resourceT2Controller.startConversion);

  /**
   * GET /api/v1/resources/t2/conversions
   * Get user's conversions
   * Query: ?status=in_progress&limit=10&offset=0
   */
  router.get('/conversions', resourceT2Controller.getUserConversions);

  /**
   * DELETE /api/v1/resources/t2/conversions/:id
   * Cancel a conversion
   */
  router.delete('/conversions/:id', resourceT2Controller.cancelConversion);

  /**
   * POST /api/v1/resources/t2/conversions/:id/speedup
   * Complete a conversion instantly with premium currency
   */
  router.post('/conversions/:id/speedup', resourceT2Controller.speedupConversion);

  /**
   * POST /api/v1/resources/t2/collect
   * Collect passive production
   */
  router.post('/collect', resourceT2Controller.collectPassiveProduction);

  /**
   * PUT /api/v1/resources/t2/storage
   * Update storage capacity (called when warehouse upgraded)
   * Body: { warehouseLevel }
   */
  router.put('/storage', resourceT2Controller.updateStorageCapacity);

  /**
   * GET /api/v1/resources/t2/statistics
   * Get T2 statistics (user or global)
   * Query: ?global=true
   */
  router.get('/statistics', resourceT2Controller.getStatistics);

  return router;
}

module.exports = createResourceT2Router;
