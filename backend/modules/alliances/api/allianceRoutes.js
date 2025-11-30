const express = require('express');
const router = express.Router();

module.exports = ({ allianceController, authMiddleware, treasuryController, territoryController, warController }) => {
  // Routes publiques (recherche et classement)
  router.get('/search', allianceController.searchAlliances);
  router.get('/top', allianceController.getTopAlliances);
  router.get('/:id', allianceController.getAlliance);

  // Routes protégées
  router.use(authMiddleware.protect);

  // Gestion alliance
  router.post('/', allianceController.createAlliance);
  router.put('/:id', allianceController.updateAlliance);
  router.delete('/:id', allianceController.disbandAlliance);

  // Membres
  router.get('/:id/members', allianceController.getMembers);
  router.put('/:id/members/:memberId/promote', allianceController.promoteMember);
  router.delete('/:id/members/:memberId', allianceController.kickMember);
  router.post('/:id/leave', allianceController.leaveAlliance);

  // Invitations
  router.post('/:id/invite', allianceController.sendInvitation);
  router.get('/my/invitations', allianceController.getInvitations);
  router.post('/invitations/:invitationId/respond', allianceController.respondToInvitation);

  // Demandes d'adhésion
  router.post('/:id/join-request', allianceController.requestToJoin);
  router.get('/:id/join-requests', allianceController.getPendingRequests);
  router.post('/join-requests/:requestId/review', allianceController.reviewJoinRequest);

  // Diplomatie
  router.get('/:id/diplomacy', allianceController.getDiplomaticRelations);
  router.post('/:id/diplomacy', allianceController.proposeDiplomacy);
  router.post('/:id/diplomacy/war', allianceController.declareWar);
  router.post('/:id/diplomacy/peace', allianceController.proposePeace);
  router.post('/:id/diplomacy/nap', allianceController.proposeNAP);
  router.post('/:id/diplomacy/ally', allianceController.proposeAlliance);
  router.delete('/:id/diplomacy/:targetAllianceId', allianceController.breakRelation);

  // Treasury (optional controller)
  if (treasuryController) {
    router.get('/:allianceId/treasury', treasuryController.getTreasuryBalances);
    router.post('/:allianceId/treasury/deposit', treasuryController.depositResources);
    router.post('/:allianceId/treasury/withdraw', treasuryController.withdrawResources);
    router.get('/:allianceId/treasury/history', treasuryController.getTransactionHistory);
    router.get('/:allianceId/treasury/contributions', treasuryController.getMemberContributions);
  }

  // Territory (optional controller)
  if (territoryController) {
    router.get('/:allianceId/territories', territoryController.getAllianceTerritories);
    router.post('/:allianceId/territories/claim', territoryController.claimTerritory);
    router.post('/:allianceId/territories/:territoryId/upgrade', territoryController.upgradeDefense);
    router.post('/:allianceId/territories/:territoryId/reinforce', territoryController.reinforceGarrison);
    router.post('/:allianceId/territories/:territoryId/withdraw', territoryController.withdrawGarrison);
    router.delete('/:allianceId/territories/:territoryId', territoryController.abandonTerritory);
    router.get('/:allianceId/territories/bonuses', territoryController.getTerritoryBonuses);
  }

  // War System (optional controller)
  if (warController) {
    router.get('/:allianceId/wars', warController.getAllianceWars);
    router.post('/:allianceId/wars/declare', warController.declareWar);
  }

  return router;
};
