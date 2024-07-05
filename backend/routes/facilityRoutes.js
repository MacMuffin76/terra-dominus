const express = require('express');
const router = express.Router();
const { getFacilityBuildings, getFacilityDetails, upgradeFacility, destroyFacility } = require('../controllers/facilityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/facility-buildings', protect, getFacilityBuildings);
router.get('/facility-buildings/:id', protect, getFacilityDetails);
router.post('/facility-buildings/:id/upgrade', protect, upgradeFacility);
router.post('/facility-buildings/:id/destroy', protect, destroyFacility);

module.exports = router;
