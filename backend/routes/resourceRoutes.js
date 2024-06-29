const express = require('express');
const router = express.Router();
const { getResourceBuildings, getBuildingDetails, upgradeBuilding, destroyBuilding } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/resource-buildings', protect, getResourceBuildings);
router.get('/resource-buildings/:id', protect, getBuildingDetails);
router.post('/resource-buildings/:id/upgrade', protect, upgradeBuilding);
router.post('/resource-buildings/:id/destroy', protect, destroyBuilding);

module.exports = router;
