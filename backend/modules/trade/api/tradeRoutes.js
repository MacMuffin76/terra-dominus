const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const tradeController = container.resolve('tradeController');
  const { protect } = require('../../../middleware/authMiddleware');
  const { strictLimiter, moderateLimiter, flexibleLimiter } = require('../../../middleware/rateLimiters');
  const { zodValidate } = require('../../../middleware/zodValidate');
  const { 
    createTradeRouteSchema, 
    updateTradeRouteSchema,
    sendConvoySchema 
  } = require('../../../validation/tradeSchemas');
  
  // Routes commerciales
  router.post('/routes', strictLimiter, protect, zodValidate(createTradeRouteSchema), tradeController.establishRoute);
  router.get('/routes', moderateLimiter, protect, tradeController.getUserRoutes);
  router.put('/routes/:id', flexibleLimiter, protect, zodValidate(updateTradeRouteSchema), tradeController.updateRoute);
  router.delete('/routes/:id', strictLimiter, protect, tradeController.deleteRoute);

  // Convois - Actions de jeu fréquentes mais contrôlées
  router.post('/convoys', flexibleLimiter, protect, zodValidate(sendConvoySchema), tradeController.sendConvoy);
  router.get('/routes/:id/convoys', moderateLimiter, protect, tradeController.getRouteConvoys);

  return router;
};
