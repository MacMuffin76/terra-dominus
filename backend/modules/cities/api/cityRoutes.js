// backend/modules/cities/api/cityRoutes.js
const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');

function createCityRouter(cityController) {
  const router = express.Router();

  // Get all cities for current user
  router.get('/', protect, cityController.getUserCities);

  // Get specialization types and bonuses
  router.get('/specializations', cityController.getSpecializationTypes);

  // Get specific city details
  router.get('/:cityId', protect, cityController.getCityDetails);

  // Set city specialization
  router.put('/:cityId/specialization', protect, cityController.setSpecialization);

  return router;
}

module.exports = createCityRouter;
