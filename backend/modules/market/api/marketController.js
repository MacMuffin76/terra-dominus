// backend/modules/market/api/marketController.js
const { logger } = require('../../../utils/logger');

module.exports = ({ marketService }) => {
  // Créer un ordre
  const createOrder = async (req, res) => {
    try {
      const { cityId, orderType, resourceType, quantity, pricePerUnit, durationHours } = req.body;
      const userId = req.user.id;

      const order = await marketService.createOrder(
        userId,
        cityId,
        orderType,
        resourceType,
        quantity,
        pricePerUnit,
        durationHours
      );

      logger.info({ userId, orderId: order.id }, 'Ordre de marché créé');
      res.status(201).json(order);
    } catch (error) {
      logger.error({ err: error, userId: req.user.id }, 'Erreur création ordre');
      res.status(400).json({ message: error.message });
    }
  };

  // Annuler un ordre
  const cancelOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await marketService.cancelOrder(parseInt(orderId), userId);

      logger.info({ userId, orderId }, 'Ordre annulé');
      res.json(order);
    } catch (error) {
      logger.error({ err: error }, 'Erreur annulation ordre');
      res.status(400).json({ message: error.message });
    }
  };

  // Exécuter une transaction
  const executeTransaction = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { cityId, quantity } = req.body;
      const userId = req.user.id;

      const transaction = await marketService.executeTransaction(
        userId,
        cityId,
        parseInt(orderId),
        quantity
      );

      logger.info({ userId, orderId, quantity }, 'Transaction exécutée');
      res.status(201).json(transaction);
    } catch (error) {
      logger.error({ err: error }, 'Erreur transaction');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les ordres actifs
  const getActiveOrders = async (req, res) => {
    try {
      const filters = {
        resourceType: req.query.resourceType,
        orderType: req.query.orderType,
        limit: parseInt(req.query.limit) || 100
      };

      const orders = await marketService.getActiveOrders(filters);

      res.json(orders);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération ordres actifs');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les ordres de l'utilisateur
  const getUserOrders = async (req, res) => {
    try {
      const userId = req.user.id;
      const status = req.query.status;

      const orders = await marketService.getUserOrders(userId, status);

      res.json(orders);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération ordres utilisateur');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir l'historique des transactions
  const getUserTransactions = async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;

      const transactions = await marketService.getUserTransactions(userId, limit);

      res.json(transactions);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération transactions');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les statistiques du marché
  const getMarketStats = async (req, res) => {
    try {
      const { resourceType } = req.params;

      const stats = await marketService.getMarketStats(resourceType);

      res.json(stats);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération statistiques');
      res.status(400).json({ message: error.message });
    }
  };

  return {
    createOrder,
    cancelOrder,
    executeTransaction,
    getActiveOrders,
    getUserOrders,
    getUserTransactions,
    getMarketStats
  };
};
