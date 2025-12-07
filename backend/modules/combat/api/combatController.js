const { logger } = require('../../../utils/logger');
const { getAnalyticsService } = require('../../../services/analyticsService');

const analyticsService = getAnalyticsService();

/**
 * CombatController - Gestion des combats et espionnage
 */
const combatController = ({ combatService }) => {
  /**
   * @openapi
   * /combat/attack:
   *   post:
   *     summary: Lancer une attaque territoriale
   *     description: Lance une attaque depuis une de vos villes vers une ville cible. Requérir des unités et respecter les distances.
   *     tags: [Combat]
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
   *               - attackType
   *               - units
   *             properties:
   *               fromCityId:
   *                 type: integer
   *                 description: ID de la ville attaquante
   *                 example: 1
   *               toCityId:
   *                 type: integer
   *                 description: ID de la ville cible
   *                 example: 5
   *               attackType:
   *                 type: string
   *                 enum: [raid, conquest, siege]
   *                 description: Type d'attaque (raid=pillage, conquest=conquête, siege=siège)
   *                 example: raid
   *               units:
   *                 type: array
   *                 description: Liste des unités envoyées
   *                 items:
   *                   type: object
   *                   required:
   *                     - entityId
   *                     - quantity
   *                   properties:
   *                     entityId:
   *                       type: integer
   *                       description: ID de l'entité unité
   *                       example: 10
   *                     quantity:
   *                       type: integer
   *                       minimum: 1
   *                       description: Nombre d'unités
   *                       example: 100
   *     responses:
   *       201:
   *         description: Attaque lancée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 attackId:
   *                   type: integer
   *                   example: 42
   *                 arrivalTime:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-29T15:30:00Z"
   *                 distance:
   *                   type: number
   *                   example: 15.5
   *                 message:
   *                   type: string
   *                   example: "Attaque lancée avec succès"
   *       400:
   *         description: Données invalides ou unités insuffisantes
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       429:
   *         description: Trop de requêtes (max 5/min)
   */
  const launchAttack = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await combatService.launchAttack(userId, req.body);

      logger.info(`Attaque lancée par user ${userId}`, { attackId: result.attackId });
      analyticsService.trackEvent({
        userId,
        eventName: 'battle_started',
        properties: {
          attackId: result.attackId,
          attackType: req.body.attackType,
          fromCityId: req.body.fromCityId,
          toCityId: req.body.toCityId,
        },
        consent: { status: req.get('x-analytics-consent') },
      });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur lancement attaque', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * @openapi
   * /combat/attacks:
   *   get:
   *     summary: Récupérer les attaques de l'utilisateur
   *     description: Liste toutes les attaques où l'utilisateur est impliqué (attaquant ou défenseur)
   *     tags: [Combat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [attacker, defender]
   *         description: Filtrer par rôle
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_progress, completed, cancelled]
   *         description: Filtrer par statut
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           maximum: 200
   *         description: Nombre maximum de résultats
   *     responses:
   *       200:
   *         description: Liste des attaques
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Attack'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserAttacks = async (req, res) => {
    try {
      const userId = req.user.id;
      const { role, status, limit } = req.query;

      const attacks = await combatService.getUserAttacks(userId, { role, status, limit });
      res.json(attacks);
    } catch (error) {
      logger.error('Erreur récupération attaques', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * POST /api/v1/combat/attack/:id/cancel
   * Annuler une attaque
   */
  const cancelAttack = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await combatService.cancelAttack(userId, parseInt(id));
      logger.info(`Attaque ${id} annulée par user ${userId}`);
      res.json(result);
    } catch (error) {
      logger.error('Erreur annulation attaque', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/combat/report/:attackId
   * Récupérer le rapport de combat
   */
  const getCombatReport = async (req, res) => {
    try {
      const { attackId } = req.params;
      const report = await combatService.getCombatReport(parseInt(attackId));

      if (!report) {
        return res.status(404).json({ message: 'Rapport introuvable' });
      }

      res.json(report);

      analyticsService.trackEvent({
        userId: req.user.id,
        eventName: 'battle_finished',
        properties: {
          attackId,
          outcome: report?.outcome || report?.result || report?.status,
        },
        consent: { status: req.get('x-analytics-consent') },
      });
    } catch (error) {
      logger.error('Erreur récupération rapport', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * POST /api/v1/combat/spy
   * Lancer une mission d'espionnage
   */
  const launchSpyMission = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await combatService.launchSpyMission(userId, req.body);

      logger.info(`Mission espionnage lancée par user ${userId}`, { missionId: result.missionId });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur lancement espionnage', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/combat/spy-missions
   * Récupérer les missions d'espionnage
   */
  const getUserSpyMissions = async (req, res) => {
    try {
      const userId = req.user.id;
      const { role, status, limit } = req.query;

      const missions = await combatService.getUserSpyMissions(userId, { role, status, limit });
      res.json(missions);
    } catch (error) {
      logger.error('Erreur récupération missions espionnage', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  return {
    launchAttack,
    getUserAttacks,
    cancelAttack,
    getCombatReport,
    launchSpyMission,
    getUserSpyMissions
  };
};

module.exports = combatController;
