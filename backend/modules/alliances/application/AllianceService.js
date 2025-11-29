const Alliance = require('../../../models/Alliance');
const AllianceMember = require('../../../models/AllianceMember');
const AllianceInvitation = require('../../../models/AllianceInvitation');
const AllianceJoinRequest = require('../../../models/AllianceJoinRequest');
const AllianceDiplomacy = require('../../../models/AllianceDiplomacy');
const { Op } = require('sequelize');
const sequelize = require('../../../db');

class AllianceService {
  // ===== CRÉATION ET GESTION D'ALLIANCE =====

  async createAlliance({ userId, name, tag, description }) {
    // Vérifier que le joueur n'est pas déjà dans une alliance
    const existingMembership = await AllianceMember.findOne({
      where: { userId }
    });

    if (existingMembership) {
      throw new Error('Vous êtes déjà membre d\'une alliance');
    }

    // Vérifier unicité nom et tag
    const existingAlliance = await Alliance.findOne({
      where: {
        [Op.or]: [
          { name },
          { tag }
        ]
      }
    });

    if (existingAlliance) {
      if (existingAlliance.name === name) {
        throw new Error('Ce nom d\'alliance est déjà pris');
      }
      if (existingAlliance.tag === tag) {
        throw new Error('Ce tag d\'alliance est déjà pris');
      }
    }

    const transaction = await sequelize.transaction();

    try {
      // Créer l'alliance
      const alliance = await Alliance.create({
        name,
        tag,
        leaderId: userId,
        description,
        memberCount: 1,
        totalPower: 0
      }, { transaction });

      // Ajouter le créateur comme leader
      await AllianceMember.create({
        allianceId: alliance.id,
        userId,
        role: 'leader',
        joinedAt: new Date()
      }, { transaction });

      await transaction.commit();

      return alliance;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAlliance(allianceId) {
    const alliance = await Alliance.findByPk(allianceId, {
      include: [
        {
          model: AllianceMember,
          as: 'members',
          include: [{ model: require('../../../models/User'), as: 'user', attributes: ['id', 'username', 'level'] }]
        }
      ]
    });

    if (!alliance) {
      throw new Error('Alliance introuvable');
    }

    return alliance;
  }

  async updateAlliance(allianceId, userId, updates) {
    const member = await this._checkPermission(allianceId, userId, ['leader', 'officer']);

    const alliance = await Alliance.findByPk(allianceId);
    
    const allowedUpdates = ['description', 'isRecruiting', 'minLevelRequired'];
    const filteredUpdates = {};
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    await alliance.update(filteredUpdates);
    return alliance;
  }

  async disbandAlliance(allianceId, userId) {
    const member = await this._checkPermission(allianceId, userId, ['leader']);

    const transaction = await sequelize.transaction();

    try {
      // Supprimer tous les membres
      await AllianceMember.destroy({
        where: { allianceId },
        transaction
      });

      // Supprimer l'alliance
      await Alliance.destroy({
        where: { id: allianceId },
        transaction
      });

      await transaction.commit();

      return { message: 'Alliance dissoute' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ===== GESTION DES MEMBRES =====

  async getMembers(allianceId) {
    const members = await AllianceMember.findAll({
      where: { allianceId },
      include: [
        {
          model: require('../../../models/User'),
          as: 'user',
          attributes: ['id', 'username', 'level']
        }
      ],
      order: [
        [sequelize.literal("CASE WHEN role = 'leader' THEN 1 WHEN role = 'officer' THEN 2 ELSE 3 END"), 'ASC'],
        ['contribution', 'DESC']
      ]
    });

    return members;
  }

  async promoteMember(allianceId, userId, targetUserId, newRole) {
    await this._checkPermission(allianceId, userId, ['leader']);

    if (!['officer', 'member'].includes(newRole)) {
      throw new Error('Rôle invalide');
    }

    const targetMember = await AllianceMember.findOne({
      where: { allianceId, userId: targetUserId }
    });

    if (!targetMember) {
      throw new Error('Membre introuvable');
    }

    if (targetMember.role === 'leader') {
      throw new Error('Impossible de changer le rôle du leader');
    }

    await targetMember.update({ role: newRole });

    return targetMember;
  }

  async kickMember(allianceId, userId, targetUserId) {
    const initiator = await this._checkPermission(allianceId, userId, ['leader', 'officer']);

    const targetMember = await AllianceMember.findOne({
      where: { allianceId, userId: targetUserId }
    });

    if (!targetMember) {
      throw new Error('Membre introuvable');
    }

    // Officers ne peuvent pas kick d'autres officers ou le leader
    if (initiator.role === 'officer' && ['leader', 'officer'].includes(targetMember.role)) {
      throw new Error('Permissions insuffisantes');
    }

    if (targetMember.role === 'leader') {
      throw new Error('Impossible d\'expulser le leader');
    }

    const transaction = await sequelize.transaction();

    try {
      await targetMember.destroy({ transaction });

      // Mettre à jour le compteur de membres
      await Alliance.decrement('memberCount', {
        where: { id: allianceId },
        transaction
      });

      await transaction.commit();

      return { message: 'Membre expulsé' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async leaveAlliance(allianceId, userId) {
    const member = await AllianceMember.findOne({
      where: { allianceId, userId }
    });

    if (!member) {
      throw new Error('Vous n\'êtes pas membre de cette alliance');
    }

    if (member.role === 'leader') {
      throw new Error('Le leader ne peut pas quitter l\'alliance. Dissolvez-la ou transférez le leadership.');
    }

    const transaction = await sequelize.transaction();

    try {
      await member.destroy({ transaction });

      await Alliance.decrement('memberCount', {
        where: { id: allianceId },
        transaction
      });

      await transaction.commit();

      return { message: 'Vous avez quitté l\'alliance' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ===== INVITATIONS =====

  async sendInvitation(allianceId, inviterId, inviteeId, message) {
    await this._checkPermission(allianceId, inviterId, ['leader', 'officer']);

    // Vérifier que l'invité n'est pas déjà membre d'une alliance
    const existingMembership = await AllianceMember.findOne({
      where: { userId: inviteeId }
    });

    if (existingMembership) {
      throw new Error('Ce joueur est déjà membre d\'une alliance');
    }

    // Vérifier qu'il n'y a pas déjà une invitation en attente
    const existingInvitation = await AllianceInvitation.findOne({
      where: {
        allianceId,
        inviteeId,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      throw new Error('Une invitation est déjà en attente pour ce joueur');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    const invitation = await AllianceInvitation.create({
      allianceId,
      inviterId,
      inviteeId,
      message,
      status: 'pending',
      expiresAt
    });

    return invitation;
  }

  async respondToInvitation(invitationId, userId, accept) {
    const invitation = await AllianceInvitation.findByPk(invitationId);

    if (!invitation) {
      throw new Error('Invitation introuvable');
    }

    if (invitation.inviteeId !== userId) {
      throw new Error('Cette invitation ne vous est pas destinée');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Cette invitation n\'est plus valide');
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await invitation.update({ status: 'expired' });
      throw new Error('Cette invitation a expiré');
    }

    const transaction = await sequelize.transaction();

    try {
      if (accept) {
        // Accepter l'invitation
        await invitation.update({
          status: 'accepted',
          respondedAt: new Date()
        }, { transaction });

        // Ajouter le membre
        await AllianceMember.create({
          allianceId: invitation.allianceId,
          userId,
          role: 'member',
          joinedAt: new Date()
        }, { transaction });

        // Incrémenter le compteur
        await Alliance.increment('memberCount', {
          where: { id: invitation.allianceId },
          transaction
        });
      } else {
        // Décliner l'invitation
        await invitation.update({
          status: 'declined',
          respondedAt: new Date()
        }, { transaction });
      }

      await transaction.commit();

      return invitation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getInvitations(userId) {
    const invitations = await AllianceInvitation.findAll({
      where: {
        inviteeId: userId,
        status: 'pending'
      },
      include: [
        { model: Alliance, as: 'alliance' },
        { model: require('../../../models/User'), as: 'inviter', attributes: ['id', 'username'] }
      ]
    });

    return invitations;
  }

  // ===== DEMANDES D'ADHÉSION =====

  async requestToJoin(allianceId, userId, message) {
    // Vérifier que le joueur n'est pas déjà membre
    const existingMembership = await AllianceMember.findOne({
      where: { userId }
    });

    if (existingMembership) {
      throw new Error('Vous êtes déjà membre d\'une alliance');
    }

    const alliance = await Alliance.findByPk(allianceId);

    if (!alliance) {
      throw new Error('Alliance introuvable');
    }

    if (!alliance.isRecruiting) {
      throw new Error('Cette alliance ne recrute pas actuellement');
    }

    // Vérifier niveau minimum
    const user = await require('../../../models/User').findByPk(userId);
    if (user.level < alliance.minLevelRequired) {
      throw new Error(`Niveau minimum requis: ${alliance.minLevelRequired}`);
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await AllianceJoinRequest.findOne({
      where: {
        allianceId,
        userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      throw new Error('Vous avez déjà une demande en attente pour cette alliance');
    }

    const request = await AllianceJoinRequest.create({
      allianceId,
      userId,
      message,
      status: 'pending'
    });

    return request;
  }

  async getPendingRequests(allianceId, userId) {
    await this._checkPermission(allianceId, userId, ['leader', 'officer']);

    const requests = await AllianceJoinRequest.findAll({
      where: {
        allianceId,
        status: 'pending'
      },
      include: [
        { model: require('../../../models/User'), as: 'user', attributes: ['id', 'username', 'level'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    return requests;
  }

  async reviewJoinRequest(requestId, reviewerId, approve) {
    const request = await AllianceJoinRequest.findByPk(requestId);

    if (!request) {
      throw new Error('Demande introuvable');
    }

    await this._checkPermission(request.allianceId, reviewerId, ['leader', 'officer']);

    if (request.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    const transaction = await sequelize.transaction();

    try {
      if (approve) {
        await request.update({
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }, { transaction });

        // Ajouter le membre
        await AllianceMember.create({
          allianceId: request.allianceId,
          userId: request.userId,
          role: 'member',
          joinedAt: new Date()
        }, { transaction });

        await Alliance.increment('memberCount', {
          where: { id: request.allianceId },
          transaction
        });
      } else {
        await request.update({
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }, { transaction });
      }

      await transaction.commit();

      return request;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ===== RECHERCHE ET CLASSEMENTS =====

  async searchAlliances(filters = {}) {
    const where = {};

    if (filters.name) {
      where.name = { [Op.iLike]: `%${filters.name}%` };
    }

    if (filters.tag) {
      where.tag = { [Op.iLike]: `%${filters.tag}%` };
    }

    if (filters.recruiting === true || filters.recruiting === 'true') {
      where.isRecruiting = true;
    }

    const alliances = await Alliance.findAll({
      where,
      order: [['totalPower', 'DESC']],
      limit: filters.limit || 50,
      include: [
        {
          model: AllianceMember,
          as: 'members',
          limit: 1,
          where: { role: 'leader' },
          include: [{ model: require('../../../models/User'), as: 'user', attributes: ['id', 'username'] }]
        }
      ]
    });

    return alliances;
  }

  async getTopAlliances(limit = 20) {
    const alliances = await Alliance.findAll({
      order: [['totalPower', 'DESC']],
      limit,
      include: [
        {
          model: AllianceMember,
          as: 'members',
          limit: 1,
          where: { role: 'leader' },
          include: [{ model: require('../../../models/User'), as: 'user', attributes: ['id', 'username'] }]
        }
      ]
    });

    return alliances;
  }

  // ===== DIPLOMATIE =====

  /**
   * Propose a diplomatic relation
   * @param {number} proposerAllianceId - Alliance proposing the relation
   * @param {number} targetAllianceId - Target alliance
   * @param {number} userId - User ID (for permission check)
   * @param {string} relationType - Type: 'ally', 'nap', 'war'
   * @param {object} terms - Optional terms (JSONB)
   * @returns {Promise<AllianceDiplomacy>}
   */
  async proposeDiplomacy(proposerAllianceId, targetAllianceId, userId, relationType, terms = {}) {
    // Vérifier permissions (leader ou officer)
    await this._checkPermission(proposerAllianceId, userId, ['leader', 'officer']);

    // Vérifier que les alliances existent
    const [proposer, target] = await Promise.all([
      Alliance.findByPk(proposerAllianceId),
      Alliance.findByPk(targetAllianceId)
    ]);

    if (!proposer || !target) {
      throw new Error('Alliance introuvable');
    }

    if (proposerAllianceId === targetAllianceId) {
      throw new Error('Impossible de créer une relation diplomatique avec sa propre alliance');
    }

    // Types valides
    const validTypes = ['neutral', 'ally', 'nap', 'war'];
    if (!validTypes.includes(relationType)) {
      throw new Error(`Type de relation invalide. Doit être: ${validTypes.join(', ')}`);
    }

    // Vérifier s'il existe déjà une relation
    let existingRelation = await AllianceDiplomacy.findOne({
      where: {
        [Op.or]: [
          { allianceId1: proposerAllianceId, allianceId2: targetAllianceId },
          { allianceId1: targetAllianceId, allianceId2: proposerAllianceId }
        ]
      }
    });

    const transaction = await sequelize.transaction();

    try {
      if (existingRelation) {
        // Mettre à jour la relation existante
        existingRelation.relationType = relationType;
        existingRelation.terms = terms;
        existingRelation.establishedAt = new Date();
        await existingRelation.save({ transaction });
      } else {
        // Créer nouvelle relation
        existingRelation = await AllianceDiplomacy.create({
          allianceId1: proposerAllianceId,
          allianceId2: targetAllianceId,
          relationType,
          terms,
          establishedAt: new Date()
        }, { transaction });
      }

      await transaction.commit();
      return existingRelation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Déclarer la guerre à une autre alliance
   * @param {number} attackerAllianceId - Alliance attaquante
   * @param {number} defenderAllianceId - Alliance défenseure
   * @param {number} userId - User ID (for permission check)
   * @param {string} reason - Raison de la guerre
   * @returns {Promise<AllianceDiplomacy>}
   */
  async declareWar(attackerAllianceId, defenderAllianceId, userId, reason = '') {
    return this.proposeDiplomacy(attackerAllianceId, defenderAllianceId, userId, 'war', { reason, declaredAt: new Date() });
  }

  /**
   * Proposer la paix (retour à neutral)
   * @param {number} allianceId - Alliance proposant la paix
   * @param {number} otherAllianceId - Autre alliance
   * @param {number} userId - User ID
   * @returns {Promise<AllianceDiplomacy>}
   */
  async proposePeace(allianceId, otherAllianceId, userId) {
    return this.proposeDiplomacy(allianceId, otherAllianceId, userId, 'neutral', { peaceProposedAt: new Date() });
  }

  /**
   * Proposer un pacte de non-agression (NAP)
   * @param {number} allianceId - Alliance proposant le NAP
   * @param {number} otherAllianceId - Autre alliance
   * @param {number} userId - User ID
   * @param {number} durationDays - Durée du NAP en jours
   * @returns {Promise<AllianceDiplomacy>}
   */
  async proposeNAP(allianceId, otherAllianceId, userId, durationDays = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    return this.proposeDiplomacy(allianceId, otherAllianceId, userId, 'nap', { 
      durationDays, 
      expiresAt 
    });
  }

  /**
   * Proposer une alliance (ally)
   * @param {number} allianceId - Alliance proposant l'alliance
   * @param {number} otherAllianceId - Autre alliance
   * @param {number} userId - User ID
   * @returns {Promise<AllianceDiplomacy>}
   */
  async proposeAlliance(allianceId, otherAllianceId, userId) {
    return this.proposeDiplomacy(allianceId, otherAllianceId, userId, 'ally', { proposedAt: new Date() });
  }

  /**
   * Obtenir toutes les relations diplomatiques d'une alliance
   * @param {number} allianceId - Alliance ID
   * @returns {Promise<Array>}
   */
  async getDiplomaticRelations(allianceId) {
    const relations = await AllianceDiplomacy.findAll({
      where: {
        [Op.or]: [
          { allianceId1: allianceId },
          { allianceId2: allianceId }
        ]
      },
      include: [
        { model: Alliance, as: 'alliance1', attributes: ['id', 'name', 'tag'] },
        { model: Alliance, as: 'alliance2', attributes: ['id', 'name', 'tag'] }
      ]
    });

    // Normaliser pour que l'alliance demandée soit toujours "nous" et l'autre "eux"
    return relations.map(rel => {
      const isAlliance1 = rel.allianceId1 === allianceId;
      return {
        id: rel.id,
        ourAlliance: isAlliance1 ? rel.alliance1 : rel.alliance2,
        theirAlliance: isAlliance1 ? rel.alliance2 : rel.alliance1,
        relationType: rel.relationType,
        terms: rel.terms,
        establishedAt: rel.establishedAt,
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt
      };
    });
  }

  /**
   * Obtenir la relation entre deux alliances
   * @param {number} allianceId1 - First alliance ID
   * @param {number} allianceId2 - Second alliance ID
   * @returns {Promise<AllianceDiplomacy|null>}
   */
  async getRelationBetween(allianceId1, allianceId2) {
    const relation = await AllianceDiplomacy.findOne({
      where: {
        [Op.or]: [
          { allianceId1, allianceId2 },
          { allianceId1: allianceId2, allianceId2: allianceId1 }
        ]
      }
    });

    return relation;
  }

  /**
   * Rompre une relation diplomatique (retour à neutral)
   * @param {number} allianceId - Alliance rompant la relation
   * @param {number} otherAllianceId - Autre alliance
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async breakRelation(allianceId, otherAllianceId, userId) {
    await this._checkPermission(allianceId, userId, ['leader', 'officer']);

    const relation = await AllianceDiplomacy.findOne({
      where: {
        [Op.or]: [
          { allianceId1: allianceId, allianceId2: otherAllianceId },
          { allianceId1: otherAllianceId, allianceId2: allianceId }
        ]
      }
    });

    if (!relation) {
      throw new Error('Aucune relation diplomatique trouvée');
    }

    // Soit supprimer, soit remettre à neutral
    relation.relationType = 'neutral';
    relation.terms = {};
    await relation.save();

    return relation;
  }

  // ===== HELPERS PRIVÉS =====

  async _checkPermission(allianceId, userId, allowedRoles) {
    const member = await AllianceMember.findOne({
      where: { allianceId, userId }
    });

    if (!member) {
      throw new Error('Vous n\'êtes pas membre de cette alliance');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new Error('Permissions insuffisantes');
    }

    return member;
  }
}

module.exports = AllianceService;
