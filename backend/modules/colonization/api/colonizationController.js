const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'ColonizationController' });

/**
 * ColonizationController - Contrôleur pour les endpoints de colonisation
 */
const createColonizationController = ({ colonizationService }) => {
  /**
   * @openapi
   * /api/v1/colonization/start:
   *   post:
   *     summary: Démarrer une mission de colonisation
   *     tags: [Colonization]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - departureCityId
   *               - targetSlotId
   *             properties:
   *               departureCityId:
   *                 type: integer
   *                 description: ID de la ville de départ
   *               targetSlotId:
   *                 type: integer
   *                 description: ID du slot cible pour la nouvelle ville
   *     responses:
   *       201:
   *         description: Mission de colonisation démarrée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 mission:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     status:
   *                       type: string
   *                     arrivalTime:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Paramètres invalides ou conditions non remplies
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const startColonization = async (req, res) => {
    try {
      const { departureCityId, targetSlotId } = req.body;

      if (!departureCityId || !targetSlotId) {
        return res.status(400).json({
          message: 'departureCityId et targetSlotId sont requis.',
        });
      }

      const result = await colonizationService.startColonization(
        req.user.id,
        parseInt(departureCityId, 10),
        parseInt(targetSlotId, 10)
      );

      (req.logger || logger).audit(
        { userId: req.user.id, missionId: result.mission.id },
        'Colonization mission started'
      );

      return res.status(201).json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error starting colonization');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors du démarrage de la colonisation.' });
    }
  };

  /**
   * @openapi
   * /api/v1/colonization/missions:
   *   get:
   *     summary: Récupérer les missions de colonisation du joueur
   *     tags: [Colonization]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_progress, completed, cancelled]
   *         description: Filtrer par statut de mission
   *     responses:
   *       200:
   *         description: Liste des missions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   status:
   *                     type: string
   *                   departureTime:
   *                     type: string
   *                     format: date-time
   *                   arrivalTime:
   *                     type: string
   *                     format: date-time
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserMissions = async (req, res) => {
    try {
      const { status } = req.query;
      
      const missions = await colonizationService.getUserMissions(
        req.user.id,
        status || null
      );

      return res.json(missions);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting missions');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des missions.' });
    }
  };

  /**
   * @openapi
   * /api/v1/colonization/missions/{id}:
   *   delete:
   *     summary: Annuler une mission de colonisation
   *     tags: [Colonization]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la mission à annuler
   *     responses:
   *       200:
   *         description: Mission annulée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 refundedUnits:
   *                   type: object
   *       400:
   *         description: Mission impossible à annuler
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const cancelMission = async (req, res) => {
    try {
      const missionId = parseInt(req.params.id, 10);

      if (isNaN(missionId)) {
        return res.status(400).json({ message: 'ID de mission invalide.' });
      }

      const result = await colonizationService.cancelMission(req.user.id, missionId);

      (req.logger || logger).audit(
        { userId: req.user.id, missionId },
        'Colonization mission cancelled'
      );

      return res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error cancelling mission');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de l\'annulation de la mission.' });
    }
  };

  /**
   * GET /api/colonization/max-cities
   * Récupère la limite de villes autorisée pour le joueur
   */
  const getMaxCitiesLimit = async (req, res) => {
    try {
      const maxCities = await colonizationService.getMaxCitiesLimit(req.user.id);
      
      return res.json({ maxCities });
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting max cities');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération de la limite de villes.' });
    }
  };

  return {
    startColonization,
    getUserMissions,
    cancelMission,
    getMaxCitiesLimit,
  };
};

module.exports = createColonizationController;
