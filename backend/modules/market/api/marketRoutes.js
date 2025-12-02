// backend/modules/market/api/marketRoutes.js
const express = require('express');
const { strictLimiter, moderateLimiter, flexibleLimiter } = require('../../../middleware/rateLimiters');

module.exports = ({ marketController, authMiddleware }) => {
  const router = express.Router();

  // Toutes les routes nécessitent l'authentification
  router.use(authMiddleware.protect);

  // Ordres (création/annulation : strict, lecture : modéré)
  router.post('/orders', strictLimiter, marketController.createOrder);
  router.delete('/orders/:orderId', strictLimiter, marketController.cancelOrder);
  router.get('/orders', flexibleLimiter, marketController.getActiveOrders);
  router.get('/my/orders', flexibleLimiter, marketController.getUserOrders);

  // Transactions (exécution : strict, lecture : modéré)
  router.post('/orders/:orderId/execute', strictLimiter, marketController.executeTransaction);
  router.get('/my/transactions', moderateLimiter, marketController.getUserTransactions);

  // Statistiques (lectures fréquentes : flexible)
  router.get('/stats/:resourceType', flexibleLimiter, marketController.getMarketStats);

  return router;
};
