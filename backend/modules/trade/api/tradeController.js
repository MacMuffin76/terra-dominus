const { logger } = require('../../../utils/logger');

/**
 * TradeController - Gestion des routes commerciales et convois
 */
const tradeController = ({ tradeService }) => {
  /**
   * POST /api/v1/trade/routes
   * Établir une nouvelle route commerciale
   */
  const establishRoute = async (req, res) => {
    try {
      const userId = req.user.id;
      const route = await tradeService.establishTradeRoute(userId, req.body);

      logger.info(`Route commerciale établie par user ${userId}`, { routeId: route.id });
      res.status(201).json(route);
    } catch (error) {
      logger.error('Erreur établissement route', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/trade/routes
   * Récupérer les routes d'un utilisateur
   */
  const getUserRoutes = async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, routeType } = req.query;

      const routes = await tradeService.getUserTradeRoutes(userId, { status, routeType });
      res.json(routes);
    } catch (error) {
      logger.error('Erreur récupération routes', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * PUT /api/v1/trade/routes/:id
   * Mettre à jour une route
   */
  const updateRoute = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await tradeService.updateTradeRoute(userId, parseInt(id), req.body);
      res.json(result);
    } catch (error) {
      logger.error('Erreur mise à jour route', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * DELETE /api/v1/trade/routes/:id
   * Supprimer une route
   */
  const deleteRoute = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await tradeService.deleteTradeRoute(userId, parseInt(id));
      logger.info(`Route ${id} supprimée par user ${userId}`);
      res.json(result);
    } catch (error) {
      logger.error('Erreur suppression route', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * POST /api/v1/trade/convoys
   * Envoyer un convoi manuel
   */
  const sendConvoy = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await tradeService.sendConvoy(userId, req.body);

      logger.info(`Convoi envoyé par user ${userId}`, { convoyId: result.convoyId });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur envoi convoi', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/trade/routes/:id/convoys
   * Récupérer les convois d'une route
   */
  const getRouteConvoys = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status, limit } = req.query;

      const convoys = await tradeService.getRouteConvoys(userId, parseInt(id), { status, limit });
      res.json(convoys);
    } catch (error) {
      logger.error('Erreur récupération convois', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  return {
    establishRoute,
    getUserRoutes,
    updateRoute,
    deleteRoute,
    sendConvoy,
    getRouteConvoys
  };
};

module.exports = tradeController;
