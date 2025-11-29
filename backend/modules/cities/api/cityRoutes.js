// backend/modules/cities/api/cityRoutes.js
const express = require('express');

function createCityRouter(cityController) {
  const router = express.Router();

  // Get all cities for current user
  router.get('/', cityController.getUserCities);

  // Get specialization types and bonuses
  router.get('/specializations', cityController.getSpecializationTypes);

  // Get specific city details
  router.get('/:cityId', cityController.getCityDetails);

  // Set city specialization
  router.put('/:cityId/specialization', cityController.setSpecialization);

  return router;
}

module.exports = createCityRouter;
