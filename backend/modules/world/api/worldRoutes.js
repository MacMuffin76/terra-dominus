const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

/**
 * Routes pour la carte du monde et l'exploration
 */
const createWorldRouter = (container) => {
  const router = Router();
  const controller = container.resolve('worldController');

  // Récupérer la portion visible de la carte
  router.get('/visible', protect, controller.getVisibleWorld);

  // Récupérer les emplacements de villes disponibles
  router.get('/city-slots', protect, controller.getAvailableCitySlots);

  // Informations détaillées d'une case spécifique
  router.get('/tile/:x/:y', protect, controller.getTileInfo);

  // Statistiques globales
  router.get('/stats', protect, controller.getWorldStats);

  return router;
};

module.exports = createWorldRouter;
