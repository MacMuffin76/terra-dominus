const { runWithContext } = require('../../../utils/logger');
const { Op } = require('sequelize');

/**
 * TradeRepository - Gestion des routes commerciales et convois
 */
class TradeRepository {
  constructor({ TradeRoute, TradeConvoy, City, User }) {
    this.TradeRoute = TradeRoute;
    this.TradeConvoy = TradeConvoy;
    this.City = City;
    this.User = User;
  }

  /**
   * Créer une nouvelle route commerciale
   */
  async createTradeRoute(routeData, transaction) {
    return runWithContext(async () => {
      return this.TradeRoute.create(routeData, { transaction });
    });
  }

  /**
   * Récupérer les routes d'un utilisateur
   */
  async getUserTradeRoutes(userId, filters = {}) {
    return runWithContext(async () => {
      const { status, routeType } = filters;
      const where = { owner_user_id: userId };

      if (status) where.status = status;
      if (routeType) where.route_type = routeType;

      return this.TradeRoute.findAll({
        where,
        include: [
          { model: this.City, as: 'originCity', attributes: ['id', 'name', 'coord_x', 'coord_y'] },
          { model: this.City, as: 'destinationCity', attributes: ['id', 'name', 'coord_x', 'coord_y'] }
        ],
        order: [['established_at', 'DESC']]
      });
    });
  }

  /**
   * Récupérer une route par ID
   */
  async getTradeRouteById(routeId) {
    return runWithContext(async () => {
      return this.TradeRoute.findByPk(routeId, {
        include: [
          { model: this.City, as: 'originCity' },
          { model: this.City, as: 'destinationCity' },
          { model: this.User, as: 'owner', attributes: ['id', 'username'] }
        ]
      });
    });
  }

  /**
   * Mettre à jour une route commerciale
   */
  async updateTradeRoute(routeId, updateData, transaction) {
    return runWithContext(async () => {
      return this.TradeRoute.update(updateData, { where: { id: routeId }, transaction });
    });
  }

  /**
   * Supprimer une route commerciale
   */
  async deleteTradeRoute(routeId, transaction) {
    return runWithContext(async () => {
      return this.TradeRoute.destroy({ where: { id: routeId }, transaction });
    });
  }

  /**
   * Créer un convoi
   */
  async createConvoy(convoyData, transaction) {
    return runWithContext(async () => {
      return this.TradeConvoy.create(convoyData, { transaction });
    });
  }

  /**
   * Récupérer un convoi par ID
   */
  async getConvoyById(convoyId) {
    return runWithContext(async () => {
      return this.TradeConvoy.findByPk(convoyId, {
        include: [
          { model: this.TradeRoute, as: 'route' },
          { model: this.City, as: 'originCity', attributes: ['id', 'name', 'user_id'] },
          { model: this.City, as: 'destinationCity', attributes: ['id', 'name', 'user_id'] }
        ]
      });
    });
  }

  /**
   * Récupérer les convois d'une route
   */
  async getRouteConvoys(routeId, filters = {}) {
    return runWithContext(async () => {
      const { status, limit = 50 } = filters;
      const where = { trade_route_id: routeId };

      if (status) where.status = status;

      return this.TradeConvoy.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit
      });
    });
  }

  /**
   * Récupérer les convois arrivés (pour le worker)
   */
  async getArrivedConvoys() {
    return runWithContext(async () => {
      return this.TradeConvoy.findAll({
        where: {
          status: 'traveling',
          arrival_time: { [Op.lte]: new Date() }
        },
        include: [
          { model: this.TradeRoute, as: 'route' },
          { model: this.City, as: 'originCity' },
          { model: this.City, as: 'destinationCity' }
        ]
      });
    });
  }

  /**
   * Mettre à jour un convoi
   */
  async updateConvoy(convoyId, updateData, transaction) {
    return runWithContext(async () => {
      return this.TradeConvoy.update(updateData, { where: { id: convoyId }, transaction });
    });
  }

  /**
   * Récupérer les routes qui doivent envoyer un convoi automatique
   */
  async getRoutesReadyForAutoTransfer() {
    return runWithContext(async () => {
      const now = new Date();
      const { sequelize } = this.TradeRoute;

      return this.TradeRoute.findAll({
        where: {
          status: 'active',
          route_type: 'internal',
          [Op.or]: [
            { last_convoy_time: null },
            sequelize.where(
              sequelize.literal(
                `EXTRACT(EPOCH FROM (NOW() - last_convoy_time))`
              ),
              '>=',
              sequelize.col('transfer_frequency')
            )
          ]
        },
        include: [
          { model: this.City, as: 'originCity' },
          { model: this.City, as: 'destinationCity' }
        ]
      });
    });
  }
}

module.exports = TradeRepository;
