// backend/modules/market/application/MarketService.js
const { MarketOrder, MarketTransaction, User, City, Resource } = require('../../../models');
const { Op } = require('sequelize');
const sequelize = require('../../../db');
const logger = require('../../../utils/logger');

class MarketService {
  constructor() {
    this.TAX_RATE = 0.05; // 5% de taxe sur les transactions
  }

  /**
   * Create a new market order
   * @param {number} userId - User ID
   * @param {number} cityId - City ID
   * @param {string} orderType - 'buy' or 'sell'
   * @param {string} resourceType - Resource type
   * @param {number} quantity - Quantity
   * @param {number} pricePerUnit - Price per unit
   * @param {number} durationHours - Optional duration in hours
   * @returns {Promise<MarketOrder>}
   */
  async createOrder(userId, cityId, orderType, resourceType, quantity, pricePerUnit, durationHours = null) {
    // Vérifier que la ville appartient au joueur
    const city = await City.findOne({
      where: { id: cityId, user_id: userId }
    });

    if (!city) {
      throw new Error('Ville introuvable ou vous n\'en êtes pas propriétaire');
    }

    // Vérifier les ressources disponibles pour les ordres de vente
    if (orderType === 'sell') {
      const resource = await Resource.findOne({
        where: { city_id: cityId, type: resourceType }
      });

      if (!resource || resource.quantity < quantity) {
        throw new Error('Ressources insuffisantes pour créer cet ordre de vente');
      }
    }

    // Vérifier l'or pour les ordres d'achat
    if (orderType === 'buy') {
      const totalCost = quantity * pricePerUnit;
      const goldResource = await Resource.findOne({
        where: { city_id: cityId, type: 'gold' }
      });

      if (!goldResource || goldResource.quantity < totalCost) {
        throw new Error('Or insuffisant pour créer cet ordre d\'achat');
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // Calculer l'expiration
      let expiresAt = null;
      if (durationHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);
      }

      // Créer l'ordre
      const order = await MarketOrder.create({
        userId,
        cityId,
        orderType,
        resourceType,
        quantity,
        remainingQuantity: quantity,
        pricePerUnit,
        status: 'active',
        expiresAt
      }, { transaction });

      // Bloquer les ressources ou l'or
      if (orderType === 'sell') {
        await Resource.decrement('quantity', {
          by: quantity,
          where: { city_id: cityId, type: resourceType },
          transaction
        });
      } else {
        const totalCost = quantity * pricePerUnit;
        await Resource.decrement('quantity', {
          by: totalCost,
          where: { city_id: cityId, type: 'gold' },
          transaction
        });
      }

      await transaction.commit();
      logger.info({ userId, orderId: order.id, orderType, resourceType }, 'Ordre de marché créé');

      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel an order and refund resources
   * @param {number} orderId - Order ID
   * @param {number} userId - User ID
   * @returns {Promise<MarketOrder>}
   */
  async cancelOrder(orderId, userId) {
    const order = await MarketOrder.findOne({
      where: { id: orderId, userId, status: 'active' }
    });

    if (!order) {
      throw new Error('Ordre introuvable ou déjà traité');
    }

    const transaction = await sequelize.transaction();

    try {
      // Rembourser les ressources bloquées
      if (order.orderType === 'sell') {
        await Resource.increment('quantity', {
          by: order.remainingQuantity,
          where: { city_id: order.cityId, type: order.resourceType },
          transaction
        });
      } else {
        const refundAmount = order.remainingQuantity * parseFloat(order.pricePerUnit);
        await Resource.increment('quantity', {
          by: Math.floor(refundAmount),
          where: { city_id: order.cityId, type: 'gold' },
          transaction
        });
      }

      order.status = 'cancelled';
      await order.save({ transaction });

      await transaction.commit();
      logger.info({ userId, orderId }, 'Ordre annulé');

      return order;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Execute a market transaction (buy from a sell order or sell to a buy order)
   * @param {number} buyerId - Buyer user ID
   * @param {number} buyerCityId - Buyer city ID
   * @param {number} orderId - Order ID to fulfill
   * @param {number} quantity - Quantity to buy
   * @returns {Promise<MarketTransaction>}
   */
  async executeTransaction(buyerId, buyerCityId, orderId, quantity) {
    const order = await MarketOrder.findOne({
      where: { id: orderId, status: 'active' },
      include: [{ model: City, as: 'city' }]
    });

    if (!order) {
      throw new Error('Ordre introuvable ou inactif');
    }

    if (order.userId === buyerId) {
      throw new Error('Vous ne pouvez pas acheter votre propre ordre');
    }

    if (order.remainingQuantity < quantity) {
      throw new Error('Quantité insuffisante dans l\'ordre');
    }

    // Vérifier que la ville de l'acheteur existe
    const buyerCity = await City.findOne({
      where: { id: buyerCityId, user_id: buyerId }
    });

    if (!buyerCity) {
      throw new Error('Ville introuvable');
    }

    const totalPrice = quantity * parseFloat(order.pricePerUnit);
    const taxAmount = Math.floor(totalPrice * this.TAX_RATE);
    const finalPrice = totalPrice + taxAmount;

    const transaction = await sequelize.transaction();

    try {
      let transactionRecord;

      if (order.orderType === 'sell') {
        // Achat depuis un ordre de vente
        // L'acheteur paie avec son or
        const buyerGold = await Resource.findOne({
          where: { city_id: buyerCityId, type: 'gold' },
          transaction
        });

        if (!buyerGold || buyerGold.quantity < finalPrice) {
          throw new Error('Or insuffisant pour effectuer cet achat');
        }

        // Débiter l'acheteur
        await Resource.decrement('quantity', {
          by: finalPrice,
          where: { city_id: buyerCityId, type: 'gold' },
          transaction
        });

        // Créditer le vendeur
        await Resource.increment('quantity', {
          by: totalPrice, // Sans la taxe
          where: { city_id: order.cityId, type: 'gold' },
          transaction
        });

        // Donner la ressource à l'acheteur
        await Resource.increment('quantity', {
          by: quantity,
          where: { city_id: buyerCityId, type: order.resourceType },
          transaction
        });

        transactionRecord = await MarketTransaction.create({
          orderId: order.id,
          buyerId,
          sellerId: order.userId,
          buyerCityId,
          sellerCityId: order.cityId,
          resourceType: order.resourceType,
          quantity,
          pricePerUnit: order.pricePerUnit,
          totalPrice,
          taxAmount
        }, { transaction });

      } else {
        // Vente à un ordre d'achat
        // Le vendeur doit avoir la ressource
        const sellerResource = await Resource.findOne({
          where: { city_id: buyerCityId, type: order.resourceType },
          transaction
        });

        if (!sellerResource || sellerResource.quantity < quantity) {
          throw new Error('Ressources insuffisantes pour cette vente');
        }

        // Débiter la ressource du vendeur
        await Resource.decrement('quantity', {
          by: quantity,
          where: { city_id: buyerCityId, type: order.resourceType },
          transaction
        });

        // Créditer la ressource à l'acheteur de l'ordre
        await Resource.increment('quantity', {
          by: quantity,
          where: { city_id: order.cityId, type: order.resourceType },
          transaction
        });

        // Payer le vendeur (moins la taxe)
        const sellerPayment = totalPrice - taxAmount;
        await Resource.increment('quantity', {
          by: Math.floor(sellerPayment),
          where: { city_id: buyerCityId, type: 'gold' },
          transaction
        });

        transactionRecord = await MarketTransaction.create({
          orderId: order.id,
          buyerId: order.userId,
          sellerId: buyerId,
          buyerCityId: order.cityId,
          sellerCityId: buyerCityId,
          resourceType: order.resourceType,
          quantity,
          pricePerUnit: order.pricePerUnit,
          totalPrice,
          taxAmount
        }, { transaction });
      }

      // Mettre à jour l'ordre
      order.remainingQuantity -= quantity;
      if (order.remainingQuantity === 0) {
        order.status = 'completed';
      }
      await order.save({ transaction });

      await transaction.commit();
      logger.info({ buyerId, orderId, quantity }, 'Transaction de marché exécutée');

      // Mettre à jour le leaderboard économie pour les deux parties
      const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
      
      if (order.orderType === 'sell') {
        // Transaction: buyerId achète, order.userId vend
        leaderboardIntegration.updateEconomyScore(buyerId).catch(err => {
          logger.error('Error updating economy leaderboard for buyer:', err);
        });
        leaderboardIntegration.updateEconomyScore(order.userId).catch(err => {
          logger.error('Error updating economy leaderboard for seller:', err);
        });
      } else {
        // Transaction: buyerId vend, order.userId achète
        leaderboardIntegration.updateEconomyScore(buyerId).catch(err => {
          logger.error('Error updating economy leaderboard for seller:', err);
        });
        leaderboardIntegration.updateEconomyScore(order.userId).catch(err => {
          logger.error('Error updating economy leaderboard for buyer:', err);
        });
      }

      return transactionRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get active orders on the market
   * @param {object} filters - Filters (resourceType, orderType)
   * @returns {Promise<Array>}
   */
  async getActiveOrders(filters = {}) {
    const where = { status: 'active' };

    if (filters.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters.orderType) {
      where.orderType = filters.orderType;
    }

    const orders = await MarketOrder.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] },
        { model: City, as: 'city', attributes: ['id', 'name'] }
      ],
      order: [
        ['orderType', 'ASC'],
        ['pricePerUnit', filters.orderType === 'sell' ? 'ASC' : 'DESC'],
        ['createdAt', 'ASC']
      ],
      limit: filters.limit || 100
    });

    return orders;
  }

  /**
   * Get user's orders
   * @param {number} userId - User ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>}
   */
  async getUserOrders(userId, status = null) {
    const where = { userId };
    if (status) {
      where.status = status;
    }

    const orders = await MarketOrder.findAll({
      where,
      include: [{ model: City, as: 'city', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    return orders;
  }

  /**
   * Get user's transaction history
   * @param {number} userId - User ID
   * @param {number} limit - Limit
   * @returns {Promise<Array>}
   */
  async getUserTransactions(userId, limit = 50) {
    const transactions = await MarketTransaction.findAll({
      where: {
        [Op.or]: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'username'] },
        { model: User, as: 'seller', attributes: ['id', 'username'] },
        { model: MarketOrder, as: 'order', attributes: ['id', 'orderType'] }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });

    return transactions;
  }

  /**
   * Get market statistics
   * @param {string} resourceType - Resource type
   * @returns {Promise<object>}
   */
  async getMarketStats(resourceType) {
    const [buyOrders, sellOrders, recentTransactions] = await Promise.all([
      MarketOrder.findAll({
        where: { resourceType, orderType: 'buy', status: 'active' },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price_per_unit')), 'avgPrice'],
          [sequelize.fn('MAX', sequelize.col('price_per_unit')), 'maxPrice'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        raw: true
      }),
      MarketOrder.findAll({
        where: { resourceType, orderType: 'sell', status: 'active' },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price_per_unit')), 'avgPrice'],
          [sequelize.fn('MIN', sequelize.col('price_per_unit')), 'minPrice'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        raw: true
      }),
      MarketTransaction.findAll({
        where: { resourceType },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price_per_unit')), 'avgPrice'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalVolume']
        ],
        limit: 100,
        raw: true
      })
    ]);

    return {
      resourceType,
      buyOrders: {
        avgPrice: parseFloat(buyOrders[0]?.avgPrice || 0),
        maxPrice: parseFloat(buyOrders[0]?.maxPrice || 0),
        count: parseInt(buyOrders[0]?.count || 0)
      },
      sellOrders: {
        avgPrice: parseFloat(sellOrders[0]?.avgPrice || 0),
        minPrice: parseFloat(sellOrders[0]?.minPrice || 0),
        count: parseInt(sellOrders[0]?.count || 0)
      },
      recentActivity: {
        avgPrice: parseFloat(recentTransactions[0]?.avgPrice || 0),
        volume: parseInt(recentTransactions[0]?.totalVolume || 0)
      }
    };
  }
}

module.exports = MarketService;
