const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'ColonizationController' });

/**
 * ColonizationController - Contrôleur pour les endpoints de colonisation
 */
const createColonizationController = ({ colonizationService }) => {
  /**
   * POST /api/colonization/start
   * Démarre une mission de colonisation
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
   * GET /api/colonization/missions
   * Récupère les missions de colonisation du joueur
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
   * DELETE /api/colonization/missions/:id
   * Annule une mission de colonisation
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
