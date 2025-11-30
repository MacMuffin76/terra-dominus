const express = require('express');
const { protect } = require('../middleware/authMiddleware');

module.exports = (container) => {
  const router = express.Router();
  const unitUnlockController = container.resolve('unitUnlockController');

  // Get all available units (unlocked + locked)
  router.get('/available', protect, unitUnlockController.getAvailableUnits);

  // Check if specific unit is unlocked
  router.get('/check/:unitId', protect, unitUnlockController.checkUnitUnlock);

  // Get tiers summary
  router.get('/tiers', protect, unitUnlockController.getTiersSummary);

  return router;
};
