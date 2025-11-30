const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

module.exports = (container) => {
  const router = express.Router();
  const upkeepController = container.resolve('upkeepController');

  // Protected routes - player endpoints
  router.get('/report', protect, upkeepController.getUpkeepReport);
  router.get('/city/:cityId', protect, upkeepController.getCityUpkeep);

  // Admin only - manual upkeep processing
  // router.post('/process', protect, admin, upkeepController.processUpkeep);

  return router;
};
