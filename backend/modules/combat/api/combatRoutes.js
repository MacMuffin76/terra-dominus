const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const combatController = container.resolve('combatController');
  const { protect } = require('../../../middleware/authMiddleware');
  // Attaques
  router.post('/attack', protect, combatController.launchAttack);
  router.get('/attacks', protect, combatController.getUserAttacks);
  router.post('/attack/:id/cancel', protect, combatController.cancelAttack);
  router.get('/report/:attackId', protect, combatController.getCombatReport);

  // Espionnage
  router.post('/spy', protect, combatController.launchSpyMission);
  router.get('/spy-missions', protect, combatController.getUserSpyMissions);

  return router;
};
