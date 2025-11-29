const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const combatController = container.resolve('combatController');
  const { protect } = require('../../../middleware/authMiddleware');
  const { strictLimiter, moderateLimiter } = require('../../../middleware/rateLimiters');
  const { zodValidate } = require('../../../middleware/zodValidate');
  const { 
    launchAttackSchema, 
    cancelAttackSchema,
    getAttacksSchema,
    launchSpyMissionSchema 
  } = require('../../../validation/combatSchemas');
  
  // Attaques - Actions critiques avec rate limiting strict
  router.post('/attack', strictLimiter, protect, zodValidate(launchAttackSchema), combatController.launchAttack);
  router.get('/attacks', moderateLimiter, protect, zodValidate(getAttacksSchema), combatController.getUserAttacks);
  router.post('/attack/:id/cancel', strictLimiter, protect, zodValidate(cancelAttackSchema), combatController.cancelAttack);
  router.get('/report/:attackId', moderateLimiter, protect, combatController.getCombatReport);

  // Espionnage - Actions critiques avec rate limiting strict
  router.post('/spy', strictLimiter, protect, zodValidate(launchSpyMissionSchema), combatController.launchSpyMission);
  router.get('/spy-missions', moderateLimiter, protect, combatController.getUserSpyMissions);

  return router;
};
