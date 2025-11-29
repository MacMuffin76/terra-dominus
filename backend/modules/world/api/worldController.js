const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'WorldController' });

/**
 * WorldController - Contrôleur pour les endpoints de la carte du monde
 */
const createWorldController = ({ worldService }) => {
  /**
   * GET /api/world/visible
   * Récupère la portion visible de la carte pour le joueur
   */
  const getVisibleWorld = async (req, res) => {
    try {
      const { minX, minY, maxX, maxY } = req.query;
      
      const bounds = (minX || minY || maxX || maxY) ? {
        minX: minX ? parseInt(minX, 10) : undefined,
        minY: minY ? parseInt(minY, 10) : undefined,
        maxX: maxX ? parseInt(maxX, 10) : undefined,
        maxY: maxY ? parseInt(maxY, 10) : undefined,
      } : null;

      const visibleWorld = await worldService.getVisibleWorld(req.user.id, bounds);
      
      return res.json(visibleWorld);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting visible world');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération de la carte.' });
    }
  };

  /**
   * GET /api/world/city-slots
   * Récupère les emplacements de villes disponibles
   */
  const getAvailableCitySlots = async (req, res) => {
    try {
      const slots = await worldService.getAvailableCitySlots(req.user.id);
      
      return res.json(slots);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting city slots');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des emplacements.' });
    }
  };

  /**
   * GET /api/world/tile/:x/:y
   * Récupère les informations détaillées d'une case
   */
  const getTileInfo = async (req, res) => {
    try {
      const x = parseInt(req.params.x, 10);
      const y = parseInt(req.params.y, 10);

      if (isNaN(x) || isNaN(y)) {
        return res.status(400).json({ message: 'Coordonnées invalides.' });
      }

      const tileInfo = await worldService.getTileInfo(req.user.id, x, y);
      
      return res.json(tileInfo);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error getting tile info');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des informations de la case.' });
    }
  };

  /**
   * GET /api/world/stats
   * Récupère les statistiques globales de la carte
   */
  const getWorldStats = async (req, res) => {
    try {
      const stats = await worldService.getWorldStats();
      
      return res.json(stats);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error getting world stats');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des statistiques.' });
    }
  };

  return {
    getVisibleWorld,
    getAvailableCitySlots,
    getTileInfo,
    getWorldStats,
  };
};

module.exports = createWorldController;
