const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  getUserResources,
  getResourceBuildings,
  getBuildingDetails,
  upgradeBuilding,
  downgradeBuilding,
  destroyBuilding,
  saveUserResources
} = require('../controllers/resourceController');

router.get('/resource-buildings',                  protect, getResourceBuildings);
router.get('/resource-buildings/:id',              protect, getBuildingDetails);
router.post('/resource-buildings/:id/upgrade',     protect, upgradeBuilding);
router.post('/resource-buildings/:id/downgrade',   protect, downgradeBuilding);
router.post('/resource-buildings/:id/destroy',     protect, destroyBuilding);
router.get('/user-resources',                      protect, getUserResources);
router.post('/save',                               protect, saveUserResources);

module.exports = router;
