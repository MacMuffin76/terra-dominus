const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBuildingDetails,
  upgradeBuilding,
  downgradeBuilding
} = require('../controllers/buildingController');

// Détails d'un bâtiment
// GET /api/buildings/:id
router.get('/:id', protect, getBuildingDetails);

// Améliorer un bâtiment
// PUT /api/buildings/:id/upgrade
router.put('/:id/upgrade', protect, upgradeBuilding);

// Rétrograder un bâtiment
// PUT /api/buildings/:id/downgrade
router.put('/:id/downgrade', protect, downgradeBuilding);

module.exports = router;
