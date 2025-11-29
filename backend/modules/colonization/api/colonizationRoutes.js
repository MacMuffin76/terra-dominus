const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

/**
 * Routes pour la colonisation
 */
const createColonizationRouter = (container) => {
  const router = Router();
  const controller = container.resolve('colonizationController');

  // Démarrer une mission de colonisation
  router.post('/start', protect, controller.startColonization);

  // Récupérer les missions du joueur
  router.get('/missions', protect, controller.getUserMissions);

  // Annuler une mission
  router.delete('/missions/:id', protect, controller.cancelMission);

  // Récupérer la limite de villes
  router.get('/max-cities', protect, controller.getMaxCitiesLimit);

  return router;
};

module.exports = createColonizationRouter;
