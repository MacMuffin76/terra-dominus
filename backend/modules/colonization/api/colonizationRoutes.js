const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { strictLimiter, moderateLimiter } = require('../../../middleware/rateLimiters');
const { zodValidate } = require('../../../middleware/zodValidate');
const { 
  startColonizationSchema, 
  cancelMissionSchema 
} = require('../../../validation/colonizationSchemas');

/**
 * Routes pour la colonisation
 */
const createColonizationRouter = (container) => {
  const router = Router();
  const controller = container.resolve('colonizationController');

  // Démarrer une mission de colonisation - Action critique
  router.post('/start', strictLimiter, protect, zodValidate(startColonizationSchema), controller.startColonization);

  // Récupérer les missions du joueur - Lecture fréquente
  router.get('/missions', moderateLimiter, protect, controller.getUserMissions);

  // Annuler une mission - Action critique
  router.delete('/missions/:id', strictLimiter, protect, zodValidate(cancelMissionSchema), controller.cancelMission);

  // Récupérer la limite de villes - Lecture fréquente
  router.get('/max-cities', moderateLimiter, protect, controller.getMaxCitiesLimit);

  return router;
};

module.exports = createColonizationRouter;
