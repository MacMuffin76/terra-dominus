const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const tradeController = container.resolve('tradeController');
  const { protect } = require('../../../middleware/authMiddleware');
  // Routes commerciales
  router.post('/routes', protect, tradeController.establishRoute);
  router.get('/routes', protect, tradeController.getUserRoutes);
  router.put('/routes/:id', protect, tradeController.updateRoute);
  router.delete('/routes/:id', protect, tradeController.deleteRoute);

  // Convois
  router.post('/convoys', protect, tradeController.sendConvoy);
  router.get('/routes/:id/convoys', protect, tradeController.getRouteConvoys);

  return router;
};
