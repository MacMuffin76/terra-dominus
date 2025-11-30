const express = require('express');
const router = express.Router();
const territoryController = require('../controllers/allianceTerritoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (for world map)
router.get('/', territoryController.getAllTerritories);
router.get('/range', authMiddleware.protect, territoryController.getTerritoriesInRange);
router.get('/coords/:x/:y', territoryController.getTerritoryByCoords);

module.exports = router;
