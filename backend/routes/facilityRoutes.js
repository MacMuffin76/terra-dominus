// backend/routes/facilityRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getFacilityBuildings,
  getFacilityDetails,
  upgradeFacility,
  downgradeFacility,
  destroyFacility,
} = require('../controllers/facilityController');

// ================================
// LISTE DES INSTALLATIONS DU JOUEUR
// ================================
// GET /api/facilities/facility-buildings
router.get('/facility-buildings', protect, getFacilityBuildings);

// ================================
// DETAIL / ACTIONS SUR UNE INSTALLATION
// ================================
// GET /api/facilities/facility-buildings/:id
router.get('/facility-buildings/:id', protect, getFacilityDetails);

// POST /api/facilities/facility-buildings/:id/upgrade
router.post('/facility-buildings/:id/upgrade', protect, upgradeFacility);

// POST /api/facilities/facility-buildings/:id/downgrade
router.post('/facility-buildings/:id/downgrade', protect, downgradeFacility);

// POST /api/facilities/facility-buildings/:id/destroy
router.post('/facility-buildings/:id/destroy', protect, destroyFacility);

module.exports = router;
