const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { upgradeBuildingSchema, saveUserResourcesSchema } = require('../validation/resourceValidation');

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
router.post('/resource-buildings/:id/upgrade',     protect, validate(upgradeBuildingSchema), upgradeBuilding);
router.post('/resource-buildings/:id/downgrade',   protect, downgradeBuilding);
router.post('/resource-buildings/:id/destroy',     protect, destroyBuilding);
router.get('/user-resources',                      protect, getUserResources);
router.post('/save',                               protect, validate(saveUserResourcesSchema), saveUserResources);

module.exports = router;
