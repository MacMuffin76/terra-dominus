/**
 * War Routes
 * Routes dédiées pour les opérations de guerre inter-alliances
 */

const express = require('express');
const router = express.Router();

module.exports = ({ warController, authMiddleware }) => {
  // Route publique - Liste des guerres actives
  router.get('/active', warController.getActiveWars);
  router.get('/check/:alliance1Id/:alliance2Id', warController.checkWarStatus);

  // Routes protégées
  router.use(authMiddleware.protect);

  // Détails d'une guerre
  router.get('/:warId', warController.getWarDetails);
  router.get('/:warId/statistics', warController.getWarStatistics);

  // Batailles
  router.post('/:warId/battles', warController.recordBattle);
  router.get('/:warId/battles', warController.getWarBattles);

  // Cessez-le-feu
  router.post('/:warId/ceasefire/propose', warController.proposeCeasefire);
  router.post('/:warId/ceasefire/respond', warController.respondToCeasefire);

  // Fin de guerre
  router.post('/:warId/end', warController.endWar);

  return router;
};
