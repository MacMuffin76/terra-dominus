/**
 * AllianceWarService
 * Business logic pour le système de guerres d'alliances
 * Gère les déclarations, batailles, scores et termes de paix
 */

const AllianceWarRepository = require('../infra/AllianceWarRepository');
const { Alliance, AllianceMember, User, sequelize } = require('../../../models');
const { getLogger } = require('../../../utils/logger');

const logger = getLogger('AllianceWarService');

class AllianceWarService {
  constructor(allianceWarRepository) {
    this.warRepository = allianceWarRepository || new AllianceWarRepository();
  }

  /**
   * Configuration des points par type de victoire
   */
  static VICTORY_POINTS = {
    minor_victory: 10, // Victoire tactique mineure
    major_victory: 25, // Victoire tactique majeure
    strategic_victory: 50, // Victoire stratégique (territoire/base)
    territory_captured: 100, // Capture de territoire
  };

  /**
   * Configuration des limites
   */
  static LIMITS = {
    max_concurrent_wars: 3, // Maximum de guerres simultanées par alliance
    min_members_to_declare: 5, // Minimum de membres pour déclarer la guerre
    ceasefire_duration_hours: 48, // Durée minimum d'un cessez-le-feu
    war_cooldown_hours: 24, // Cooldown après la fin d'une guerre
  };

  /**
   * Déclarer la guerre à une autre alliance
   */
  async declareWar(attackerAllianceId, defenderAllianceId, declaredByUserId, warGoal = null) {
    const transaction = await sequelize.transaction();

    try {
      // Vérifier que les alliances existent
      const attackerAlliance = await Alliance.findByPk(attackerAllianceId, { transaction });
      const defenderAlliance = await Alliance.findByPk(defenderAllianceId, { transaction });

      if (!attackerAlliance || !defenderAlliance) {
        throw new Error('Alliance not found');
      }

      // Vérifier que l'utilisateur est leader de l'alliance attaquante
      const declarer = await AllianceMember.findOne({
        where: {
          user_id: declaredByUserId,
          alliance_id: attackerAllianceId,
          role: 'Leader',
        },
        transaction,
      });

      if (!declarer) {
        throw new Error('Only alliance leaders can declare war');
      }

      // Vérifier qu'on ne déclare pas la guerre à soi-même
      if (attackerAllianceId === defenderAllianceId) {
        throw new Error('Cannot declare war on your own alliance');
      }

      // Vérifier le nombre de guerres actives de l'attaquant
      const activeWarsCount = await this.warRepository.countActiveWars(attackerAllianceId);
      if (activeWarsCount >= AllianceWarService.LIMITS.max_concurrent_wars) {
        throw new Error(
          `Cannot have more than ${AllianceWarService.LIMITS.max_concurrent_wars} concurrent wars`
        );
      }

      // Vérifier qu'il n'y a pas déjà une guerre active entre ces alliances
      const existingWar = await this.warRepository.findActiveWarBetween(
        attackerAllianceId,
        defenderAllianceId
      );

      if (existingWar.length > 0) {
        throw new Error('A war is already active between these alliances');
      }

      // Vérifier le nombre minimum de membres
      if (attackerAlliance.membre_count < AllianceWarService.LIMITS.min_members_to_declare) {
        throw new Error(
          `Need at least ${AllianceWarService.LIMITS.min_members_to_declare} members to declare war`
        );
      }

      // Créer la guerre
      const war = await this.warRepository.createWar(
        {
          attackerAllianceId,
          defenderAllianceId,
          declaredBy: declaredByUserId,
          warGoal,
          status: 'active',
          attackerScore: 0,
          defenderScore: 0,
          startedAt: new Date(),
        },
        transaction
      );

      await transaction.commit();

      logger.info('War declared', {
        warId: war.id,
        attacker: attackerAllianceId,
        defender: defenderAllianceId,
        declaredBy: declaredByUserId,
      });

      return await this.warRepository.findWarById(war.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to declare war', { error: error.message });
      throw error;
    }
  }

  /**
   * Enregistrer un combat dans une guerre
   */
  async recordBattle(warId, battleData) {
    const transaction = await sequelize.transaction();

    try {
      const war = await this.warRepository.findWarById(warId);

      if (!war) {
        throw new Error('War not found');
      }

      if (war.status !== 'active') {
        throw new Error('War is not active');
      }

      // Vérifier que les combattants appartiennent bien aux alliances en guerre
      const attackerMember = await AllianceMember.findOne({
        where: {
          user_id: battleData.attackerUserId,
          alliance_id: war.attackerAllianceId,
        },
        transaction,
      });

      const defenderMember = await AllianceMember.findOne({
        where: {
          user_id: battleData.defenderUserId,
          alliance_id: war.defenderAllianceId,
        },
        transaction,
      });

      if (!attackerMember || !defenderMember) {
        throw new Error('Participants must be members of the warring alliances');
      }

      // Déterminer les points selon le type de victoire
      let pointsAwarded = 0;
      if (battleData.outcome === 'attacker_victory') {
        pointsAwarded = this._calculateVictoryPoints(battleData);
      } else if (battleData.outcome === 'defender_victory') {
        pointsAwarded = this._calculateVictoryPoints(battleData);
      }

      // Enregistrer la bataille
      const battle = await this.warRepository.recordBattle(
        {
          warId,
          battleReportId: battleData.battleReportId || null,
          attackerUserId: battleData.attackerUserId,
          defenderUserId: battleData.defenderUserId,
          outcome: battleData.outcome,
          pointsAwarded,
          resourcesPillaged: battleData.resourcesPillaged || {},
          territoryCaptured: battleData.territoryCaptured || null,
          occurredAt: new Date(),
        },
        transaction
      );

      // Mettre à jour le score de la guerre
      const isAttackerVictory = battleData.outcome === 'attacker_victory';
      await this.warRepository.updateWarScore(
        warId,
        pointsAwarded,
        isAttackerVictory,
        transaction
      );

      // Ajouter les pertes (casualties) si fournies
      if (battleData.attackerCasualties) {
        await this.warRepository.addCasualties(
          warId,
          battleData.attackerCasualties,
          true,
          transaction
        );
      }

      if (battleData.defenderCasualties) {
        await this.warRepository.addCasualties(
          warId,
          battleData.defenderCasualties,
          false,
          transaction
        );
      }

      // Si un territoire a été capturé, l'ajouter aux territoires contestés
      if (battleData.territoryCaptured) {
        await this.warRepository.addContestedTerritory(
          warId,
          battleData.territoryCaptured,
          transaction
        );
      }

      await transaction.commit();

      logger.info('Battle recorded in war', {
        warId,
        battleId: battle.id,
        outcome: battleData.outcome,
        points: pointsAwarded,
      });

      return {
        battle,
        updatedWar: await this.warRepository.findWarById(warId),
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to record battle', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculer les points de victoire d'une bataille
   */
  _calculateVictoryPoints(battleData) {
    let points = AllianceWarService.VICTORY_POINTS.minor_victory;

    // Bonus pour capture de territoire
    if (battleData.territoryCaptured) {
      points += AllianceWarService.VICTORY_POINTS.territory_captured;
    }

    // Bonus pour ressources pillées importantes
    const totalPillaged = Object.values(battleData.resourcesPillaged || {}).reduce(
      (sum, val) => sum + val,
      0
    );

    if (totalPillaged > 100000) {
      points += AllianceWarService.VICTORY_POINTS.major_victory;
    } else if (totalPillaged > 50000) {
      points += AllianceWarService.VICTORY_POINTS.minor_victory;
    }

    return points;
  }

  /**
   * Obtenir les guerres d'une alliance
   */
  async getAllianceWars(allianceId, userId, options = {}) {
    // Vérifier que l'utilisateur est membre de l'alliance
    const member = await AllianceMember.findOne({
      where: { user_id: userId, alliance_id: allianceId },
    });

    if (!member) {
      throw new Error('You must be a member of this alliance to view its wars');
    }

    return await this.warRepository.findAllianceWars(allianceId, options);
  }

  /**
   * Obtenir les détails d'une guerre
   */
  async getWarDetails(warId, userId) {
    const war = await this.warRepository.findWarById(warId);

    if (!war) {
      throw new Error('War not found');
    }

    // Vérifier que l'utilisateur est membre d'une des alliances impliquées
    const member = await AllianceMember.findOne({
      where: {
        user_id: userId,
        alliance_id: {
          [sequelize.Sequelize.Op.in]: [war.attackerAllianceId, war.defenderAllianceId],
        },
      },
    });

    if (!member) {
      throw new Error('You must be a member of one of the warring alliances');
    }

    return war;
  }

  /**
   * Obtenir les statistiques d'une guerre
   */
  async getWarStatistics(warId, userId) {
    await this.getWarDetails(warId, userId); // Vérifier les permissions
    return await this.warRepository.getWarStatistics(warId);
  }

  /**
   * Proposer un cessez-le-feu
   */
  async proposeCeasefire(warId, userId, terms) {
    const transaction = await sequelize.transaction();

    try {
      const war = await this.warRepository.findWarById(warId);

      if (!war) {
        throw new Error('War not found');
      }

      if (war.status !== 'active') {
        throw new Error('Can only propose ceasefire during active wars');
      }

      // Vérifier que l'utilisateur est Leader d'une des alliances
      const member = await AllianceMember.findOne({
        where: {
          user_id: userId,
          alliance_id: {
            [sequelize.Sequelize.Op.in]: [war.attackerAllianceId, war.defenderAllianceId],
          },
          role: 'Leader',
        },
        transaction,
      });

      if (!member) {
        throw new Error('Only alliance leaders can propose ceasefire');
      }

      const updatedWar = await this.warRepository.proposeCeasefire(
        warId,
        member.alliance_id,
        terms,
        transaction
      );

      await transaction.commit();

      logger.info('Ceasefire proposed', {
        warId,
        proposedBy: member.alliance_id,
      });

      return updatedWar;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to propose ceasefire', { error: error.message });
      throw error;
    }
  }

  /**
   * Répondre à une proposition de cessez-le-feu
   */
  async respondToCeasefire(warId, userId, accepted) {
    const transaction = await sequelize.transaction();

    try {
      const war = await this.warRepository.findWarById(warId);

      if (!war) {
        throw new Error('War not found');
      }

      if (!war.warTerms?.ceasefireProposal) {
        throw new Error('No ceasefire proposal found');
      }

      if (war.warTerms.ceasefireProposal.status !== 'pending') {
        throw new Error('Ceasefire proposal already responded to');
      }

      // Vérifier que l'utilisateur est Leader de l'alliance qui n'a pas proposé
      const proposingAllianceId = war.warTerms.ceasefireProposal.proposedBy;
      const respondingAllianceId =
        proposingAllianceId === war.attackerAllianceId
          ? war.defenderAllianceId
          : war.attackerAllianceId;

      const member = await AllianceMember.findOne({
        where: {
          user_id: userId,
          alliance_id: respondingAllianceId,
          role: 'Leader',
        },
        transaction,
      });

      if (!member) {
        throw new Error('Only the opposing alliance leader can respond to ceasefire');
      }

      const updatedWar = await this.warRepository.respondToCeasefire(warId, accepted, transaction);

      await transaction.commit();

      logger.info('Ceasefire responded', {
        warId,
        accepted,
        respondedBy: respondingAllianceId,
      });

      return updatedWar;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to respond to ceasefire', { error: error.message });
      throw error;
    }
  }

  /**
   * Terminer une guerre (surrender ou victory condition atteinte)
   */
  async endWar(warId, userId, winnerAllianceId, warTerms = {}) {
    const transaction = await sequelize.transaction();

    try {
      const war = await this.warRepository.findWarById(warId);

      if (!war) {
        throw new Error('War not found');
      }

      if (war.status !== 'active' && war.status !== 'ceasefire') {
        throw new Error('War is already ended');
      }

      // Vérifier que l'utilisateur est Leader d'une des alliances
      const member = await AllianceMember.findOne({
        where: {
          user_id: userId,
          alliance_id: {
            [sequelize.Sequelize.Op.in]: [war.attackerAllianceId, war.defenderAllianceId],
          },
          role: 'Leader',
        },
        transaction,
      });

      if (!member) {
        throw new Error('Only alliance leaders can end wars');
      }

      // Vérifier que le gagnant est une des alliances en guerre
      if (
        winnerAllianceId !== war.attackerAllianceId &&
        winnerAllianceId !== war.defenderAllianceId
      ) {
        throw new Error('Winner must be one of the warring alliances');
      }

      const updatedWar = await this.warRepository.endWar(
        warId,
        winnerAllianceId,
        warTerms,
        transaction
      );

      await transaction.commit();

      logger.info('War ended', {
        warId,
        winner: winnerAllianceId,
        endedBy: member.alliance_id,
      });

      return updatedWar;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to end war', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtenir toutes les guerres actives (pour affichage global)
   */
  async getActiveWars(options = {}) {
    return await this.warRepository.getActiveWars(options);
  }

  /**
   * Vérifier si deux alliances sont en guerre
   */
  async isAtWar(alliance1Id, alliance2Id) {
    return await this.warRepository.isAtWar(alliance1Id, alliance2Id);
  }

  /**
   * Obtenir les batailles d'une guerre
   */
  async getWarBattles(warId, userId, options = {}) {
    await this.getWarDetails(warId, userId); // Vérifier les permissions
    return await this.warRepository.getWarBattles(warId, options);
  }
}

module.exports = AllianceWarService;
