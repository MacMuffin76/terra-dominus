const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

/**
 * Routes pour la carte du monde et l'exploration
 */
const createWorldRouter = (container) => {
  const router = Router();
  const controller = container.resolve('worldController');

  // Récupérer la configuration du monde (seed de génération) - PUBLIC
  router.get('/config', controller.getWorldConfig);

  // Récupérer la portion visible de la carte
  router.get('/visible', protect, controller.getVisibleWorld);

  // Récupérer les emplacements de villes disponibles
  router.get('/city-slots', protect, controller.getAvailableCitySlots);

  // Informations détaillées d'une case spécifique
  router.get('/tile/:x/:y', protect, controller.getTileInfo);

  // Statistiques globales
  router.get('/stats', protect, controller.getWorldStats);

  // === Territoires ===
  
  // Récupérer les territoires du joueur
  router.get('/territories', protect, controller.getPlayerTerritories);
  
  // Revendiquer un territoire
  router.post('/territories/claim', protect, controller.claimTerritory);
  
  // Récupérer les territoires dans une zone
  router.get('/territories/bounds', protect, controller.getTerritoriesInBounds);

  // === Exploration (Fog of War) ===
  
  // Récupérer les zones explorées
  router.get('/exploration', protect, controller.getExploredAreas);
  
  // Explorer une zone
  router.post('/exploration/explore', protect, controller.exploreArea);

  return router;
};

module.exports = createWorldRouter;
