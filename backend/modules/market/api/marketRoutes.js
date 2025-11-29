// backend/modules/market/api/marketRoutes.js
const express = require('express');

module.exports = ({ marketController, authMiddleware }) => {
  const router = express.Router();

  // Toutes les routes nécessitent l'authentification
  router.use(authMiddleware.protect);

  // Ordres
  router.post('/orders', marketController.createOrder);
  router.delete('/orders/:orderId', marketController.cancelOrder);
  router.get('/orders', marketController.getActiveOrders);
  router.get('/my/orders', marketController.getUserOrders);

  // Transactions
  router.post('/orders/:orderId/execute', marketController.executeTransaction);
  router.get('/my/transactions', marketController.getUserTransactions);

  // Statistiques
  router.get('/stats/:resourceType', marketController.getMarketStats);

  return router;
};
