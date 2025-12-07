const { logger } = require('../../../utils/logger');
const { getAnalyticsService } = require('../../../services/analyticsService');

const analyticsService = getAnalyticsService();

module.exports = ({ allianceService }) => {
  // Créer une alliance
  const createAlliance = async (req, res) => {
    try {
      const { name, tag, description } = req.body;
      const userId = req.user.id;

      const alliance = await allianceService.createAlliance({
        userId,
        name,
        tag,
        description
      });

      logger.info({ userId, allianceId: alliance.id }, 'Alliance créée');

      res.status(201).json(alliance);
    } catch (error) {
      logger.error({ err: error, userId: req.user.id }, 'Erreur création alliance');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les détails d'une alliance
  const getAlliance = async (req, res) => {
    try {
      const { id } = req.params;
      const alliance = await allianceService.getAlliance(id);

      res.json(alliance);
    } catch (error) {
      logger.error({ err: error, allianceId: req.params.id }, 'Erreur récupération alliance');
      res.status(404).json({ message: error.message });
    }
  };

  // Mettre à jour l'alliance
  const updateAlliance = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      const alliance = await allianceService.updateAlliance(id, userId, updates);

      res.json(alliance);
    } catch (error) {
      logger.error({ err: error, allianceId: req.params.id }, 'Erreur mise à jour alliance');
      res.status(400).json({ message: error.message });
    }
  };

  // Dissoudre l'alliance
  const disbandAlliance = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await allianceService.disbandAlliance(id, userId);

      logger.info({ userId, allianceId: id }, 'Alliance dissoute');

      res.json(result);
    } catch (error) {
      logger.error({ err: error, allianceId: req.params.id }, 'Erreur dissolution alliance');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les membres
  const getMembers = async (req, res) => {
    try {
      const { id } = req.params;
      const members = await allianceService.getMembers(id);

      res.json(members);
    } catch (error) {
      logger.error({ err: error, allianceId: req.params.id }, 'Erreur récupération membres');
      res.status(400).json({ message: error.message });
    }
  };

  // Promouvoir un membre
  const promoteMember = async (req, res) => {
    try {
      const { id, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      const member = await allianceService.promoteMember(id, userId, memberId, role);

      res.json(member);
    } catch (error) {
      logger.error({ err: error }, 'Erreur promotion membre');
      res.status(400).json({ message: error.message });
    }
  };

  // Expulser un membre
  const kickMember = async (req, res) => {
    try {
      const { id, memberId } = req.params;
      const userId = req.user.id;

      const result = await allianceService.kickMember(id, userId, memberId);

      res.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Erreur expulsion membre');
      res.status(400).json({ message: error.message });
    }
  };

  // Quitter l'alliance
  const leaveAlliance = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await allianceService.leaveAlliance(id, userId);

      res.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Erreur quitter alliance');
      res.status(400).json({ message: error.message });
    }
  };

  // Envoyer une invitation
  const sendInvitation = async (req, res) => {
    try {
      const { id } = req.params;
      const { inviteeId, message } = req.body;
      const inviterId = req.user.id;

      const invitation = await allianceService.sendInvitation(id, inviterId, inviteeId, message);

      res.status(201).json(invitation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur envoi invitation');
      res.status(400).json({ message: error.message });
    }
  };

  // Répondre à une invitation
  const respondToInvitation = async (req, res) => {
    try {
      const { invitationId } = req.params;
      const { accept } = req.body;
      const userId = req.user.id;

      const invitation = await allianceService.respondToInvitation(invitationId, userId, accept);

      res.json(invitation);
      if (accept) {
        analyticsService.trackEvent({
          userId,
          eventName: 'alliance_joined',
          properties: { allianceId: invitation?.allianceId || invitation?.alliance_id },
          consent: { status: req.get('x-analytics-consent') },
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Erreur réponse invitation');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir ses invitations
  const getInvitations = async (req, res) => {
    try {
      const userId = req.user.id;
      const invitations = await allianceService.getInvitations(userId);

      res.json(invitations);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération invitations');
      res.status(400).json({ message: error.message });
    }
  };

  // Demander à rejoindre
  const requestToJoin = async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      const request = await allianceService.requestToJoin(id, userId, message);

      res.status(201).json(request);
    } catch (error) {
      logger.error({ err: error }, 'Erreur demande adhésion');
      res.status(400).json({ message: error.message });
    }
  };

  // Obtenir les demandes en attente
  const getPendingRequests = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const requests = await allianceService.getPendingRequests(id, userId);

      res.json(requests);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération demandes');
      res.status(400).json({ message: error.message });
    }
  };

  // Traiter une demande
  const reviewJoinRequest = async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approve } = req.body;
      const userId = req.user.id;

      const request = await allianceService.reviewJoinRequest(requestId, userId, approve);

      res.json(request);
      if (approve) {
        analyticsService.trackEvent({
          userId,
          eventName: 'alliance_joined',
          properties: { allianceId: request?.allianceId || request?.alliance_id },
          consent: { status: req.get('x-analytics-consent') },
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Erreur traitement demande');
      res.status(400).json({ message: error.message });
    }
  };

  // Rechercher des alliances
  const searchAlliances = async (req, res) => {
    try {
      const filters = req.query;
      const alliances = await allianceService.searchAlliances(filters);

      res.json(alliances);
    } catch (error) {
      logger.error({ err: error }, 'Erreur recherche alliances');
      res.status(400).json({ message: error.message });
    }
  };

  // Classement des alliances
  const getTopAlliances = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const alliances = await allianceService.getTopAlliances(limit);

      res.json(alliances);
    } catch (error) {
      logger.error({ err: error }, 'Erreur classement alliances');
      res.status(400).json({ message: error.message });
    }
  };

  // ===== DIPLOMATIE =====

  // Obtenir les relations diplomatiques
  const getDiplomaticRelations = async (req, res) => {
    try {
      const { id } = req.params;
      const relations = await allianceService.getDiplomaticRelations(id);

      res.json(relations);
    } catch (error) {
      logger.error({ err: error }, 'Erreur récupération relations diplomatiques');
      res.status(400).json({ message: error.message });
    }
  };

  // Proposer une relation diplomatique
  const proposeDiplomacy = async (req, res) => {
    try {
      const { id } = req.params; // Notre alliance
      const { targetAllianceId, relationType, terms } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.proposeDiplomacy(
        parseInt(id),
        targetAllianceId,
        userId,
        relationType,
        terms
      );

      logger.info({ allianceId: id, targetAllianceId, relationType }, 'Relation diplomatique proposée');

      res.status(201).json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur proposition diplomatique');
      res.status(400).json({ message: error.message });
    }
  };

  // Déclarer la guerre
  const declareWar = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetAllianceId, reason } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.declareWar(
        parseInt(id),
        targetAllianceId,
        userId,
        reason
      );

      logger.warn({ allianceId: id, targetAllianceId, reason }, 'Guerre déclarée');

      res.status(201).json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur déclaration guerre');
      res.status(400).json({ message: error.message });
    }
  };

  // Proposer la paix
  const proposePeace = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetAllianceId } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.proposePeace(
        parseInt(id),
        targetAllianceId,
        userId
      );

      logger.info({ allianceId: id, targetAllianceId }, 'Paix proposée');

      res.json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur proposition paix');
      res.status(400).json({ message: error.message });
    }
  };

  // Proposer un NAP (Non-Aggression Pact)
  const proposeNAP = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetAllianceId, durationDays } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.proposeNAP(
        parseInt(id),
        targetAllianceId,
        userId,
        durationDays || 30
      );

      logger.info({ allianceId: id, targetAllianceId, durationDays }, 'NAP proposé');

      res.status(201).json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur proposition NAP');
      res.status(400).json({ message: error.message });
    }
  };

  // Proposer une alliance
  const proposeAlliance = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetAllianceId } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.proposeAlliance(
        parseInt(id),
        targetAllianceId,
        userId
      );

      logger.info({ allianceId: id, targetAllianceId }, 'Alliance proposée');

      res.status(201).json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur proposition alliance');
      res.status(400).json({ message: error.message });
    }
  };

  // Rompre une relation
  const breakRelation = async (req, res) => {
    try {
      const { id } = req.params;
      const { targetAllianceId } = req.body;
      const userId = req.user.id;

      const relation = await allianceService.breakRelation(
        parseInt(id),
        targetAllianceId,
        userId
      );

      logger.info({ allianceId: id, targetAllianceId }, 'Relation rompue');

      res.json(relation);
    } catch (error) {
      logger.error({ err: error }, 'Erreur rupture relation');
      res.status(400).json({ message: error.message });
    }
  };

  return {
    createAlliance,
    getAlliance,
    updateAlliance,
    disbandAlliance,
    getMembers,
    promoteMember,
    kickMember,
    leaveAlliance,
    sendInvitation,
    respondToInvitation,
    getInvitations,
    requestToJoin,
    getPendingRequests,
    reviewJoinRequest,
    searchAlliances,
    getTopAlliances,
    // Diplomatie
    getDiplomaticRelations,
    proposeDiplomacy,
    declareWar,
    proposePeace,
    proposeNAP,
    proposeAlliance,
    breakRelation
  };
};
