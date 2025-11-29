const { logger } = require('../../../utils/logger');

/**
 * TradeController - Gestion des routes commerciales et convois
 */
const tradeController = ({ tradeService }) => {
  /**
   * @openapi
   * /api/v1/trade/routes:
   *   post:
   *     summary: Établir une nouvelle route commerciale
   *     tags: [Trade]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fromCityId
   *               - toCityId
   *               - resourceType
   *               - quantity
   *             properties:
   *               fromCityId:
   *                 type: integer
   *               toCityId:
   *                 type: integer
   *               resourceType:
   *                 type: string
   *                 enum: [wood, stone, iron, food]
   *               quantity:
   *                 type: integer
   *               routeType:
   *                 type: string
   *                 enum: [regular, express]
   *     responses:
   *       201:
   *         description: Route commerciale établie
   *       400:
   *         description: Paramètres invalides
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
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
   * @openapi
   * /api/v1/trade/routes:
   *   get:
   *     summary: Récupérer les routes commerciales de l'utilisateur
   *     tags: [Trade]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, completed]
   *       - in: query
   *         name: routeType
   *         schema:
   *           type: string
   *           enum: [regular, express]
   *     responses:
   *       200:
   *         description: Liste des routes commerciales
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
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
   * @openapi
   * /api/v1/trade/routes/{id}:
   *   put:
   *     summary: Mettre à jour une route commerciale
   *     tags: [Trade]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               quantity:
   *                 type: integer
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       200:
   *         description: Route mise à jour
   *       400:
   *         description: Paramètres invalides
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
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
   * @openapi
   * /api/v1/trade/routes/{id}:
   *   delete:
   *     summary: Supprimer une route commerciale
   *     tags: [Trade]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Route supprimée avec succès
   *       400:
   *         description: Route introuvable ou non autorisée
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
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
