/**
 * AllianceWarRepository
 * Data access layer pour les guerres d'alliances
 * Gère les opérations CRUD, les batailles et les statistiques de guerre
 */

const { Op } = require('sequelize');
const { AllianceWar, AllianceWarBattle, Alliance, User, sequelize } = require('../../../models');

class AllianceWarRepository {
  /**
   * Créer une nouvelle guerre entre deux alliances
   */
  async createWar(warData, transaction = null) {
    const options = transaction ? { transaction } : {};
    return await AllianceWar.create(warData, options);
  }

  /**
   * Trouver une guerre par ID avec toutes les relations
   */
  async findWarById(warId) {
    return await AllianceWar.findByPk(warId, {
      include: [
        {
          model: Alliance,
          as: 'attackerAlliance',
          attributes: ['id', 'nom', 'tag', 'level'],
        },
        {
          model: Alliance,
          as: 'defenderAlliance',
          attributes: ['id', 'nom', 'tag', 'level'],
        },
        {
          model: User,
          as: 'declarer',
          attributes: ['id', 'pseudo'],
        },
        {
          model: AllianceWarBattle,
          as: 'battles',
          separate: true,
          order: [['occurred_at', 'DESC']],
          limit: 10,
        },
      ],
    });
  }

  /**
   * Récupérer toutes les guerres d'une alliance (actives ou historiques)
   */
  async findAllianceWars(allianceId, options = {}) {
    const { status = null, limit = 20, offset = 0 } = options;

    const whereClause = {
      [Op.or]: [
        { attackerAllianceId: allianceId },
        { defenderAllianceId: allianceId },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    return await AllianceWar.findAll({
      where: whereClause,
      include: [
        {
          model: Alliance,
          as: 'attackerAlliance',
          attributes: ['id', 'nom', 'tag', 'level'],
        },
        {
          model: Alliance,
          as: 'defenderAlliance',
          attributes: ['id', 'nom', 'tag', 'level'],
        },
      ],
      order: [['started_at', 'DESC']],
      limit,
      offset,
    });
  }

  /**
   * Trouver toutes les guerres actives entre deux alliances
   */
  async findActiveWarBetween(alliance1Id, alliance2Id) {
    return await AllianceWar.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          {
            attackerAllianceId: alliance1Id,
            defenderAllianceId: alliance2Id,
          },
          {
            attackerAllianceId: alliance2Id,
            defenderAllianceId: alliance1Id,
          },
        ],
      },
      include: [
        {
          model: Alliance,
          as: 'attackerAlliance',
        },
        {
          model: Alliance,
          as: 'defenderAlliance',
        },
      ],
    });
  }

  /**
   * Mettre à jour le statut d'une guerre
   */
  async updateWarStatus(warId, status, additionalData = {}, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    const updateData = { status, ...additionalData };

    if (status === 'ended') {
      updateData.endedAt = new Date();
    }

    await war.update(updateData, options);
    return war;
  }

  /**
   * Enregistrer un combat dans une guerre
   */
  async recordBattle(battleData, transaction = null) {
    const options = transaction ? { transaction } : {};
    return await AllianceWarBattle.create(battleData, options);
  }

  /**
   * Mettre à jour le score d'une guerre après un combat
   */
  async updateWarScore(warId, points, isAttackerSide, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    if (isAttackerSide) {
      war.attackerScore += points;
    } else {
      war.defenderScore += points;
    }

    await war.save(options);
    return war;
  }

  /**
   * Ajouter des pertes (casualties) à une guerre
   */
  async addCasualties(warId, casualties, isAttackerSide, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    const currentCasualties = isAttackerSide
      ? war.attackerCasualties || {}
      : war.defenderCasualties || {};

    // Merge casualties
    Object.keys(casualties).forEach((unitType) => {
      currentCasualties[unitType] =
        (currentCasualties[unitType] || 0) + casualties[unitType];
    });

    if (isAttackerSide) {
      war.attackerCasualties = currentCasualties;
    } else {
      war.defenderCasualties = currentCasualties;
    }

    await war.save(options);
    return war;
  }

  /**
   * Ajouter un territoire contesté
   */
  async addContestedTerritory(warId, territoryId, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    const contested = war.territoriesContested || [];
    if (!contested.includes(territoryId)) {
      contested.push(territoryId);
      war.territoriesContested = contested;
      await war.save(options);
    }

    return war;
  }

  /**
   * Définir les termes de paix (war terms)
   */
  async setWarTerms(warId, terms, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    war.warTerms = terms;
    await war.save(options);
    return war;
  }

  /**
   * Terminer une guerre avec un gagnant
   */
  async endWar(warId, winnerAllianceId, warTerms = {}, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    war.status = 'ended';
    war.endedAt = new Date();
    war.winnerAllianceId = winnerAllianceId;
    war.warTerms = warTerms;

    await war.save(options);
    return war;
  }

  /**
   * Récupérer toutes les batailles d'une guerre
   */
  async getWarBattles(warId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    return await AllianceWarBattle.findAll({
      where: { warId },
      order: [['occurred_at', 'DESC']],
      limit,
      offset,
    });
  }

  /**
   * Obtenir les statistiques d'une guerre
   */
  async getWarStatistics(warId) {
    const war = await this.findWarById(warId);

    if (!war) {
      throw new Error('War not found');
    }

    const battles = await AllianceWarBattle.findAll({
      where: { warId },
    });

    const attackerVictories = battles.filter(
      (b) => b.outcome === 'attacker_victory'
    ).length;
    const defenderVictories = battles.filter(
      (b) => b.outcome === 'defender_victory'
    ).length;
    const draws = battles.filter((b) => b.outcome === 'draw').length;

    const totalResourcesPillaged = battles.reduce((acc, battle) => {
      const pillaged = battle.resourcesPillaged || {};
      Object.keys(pillaged).forEach((resource) => {
        acc[resource] = (acc[resource] || 0) + pillaged[resource];
      });
      return acc;
    }, {});

    const territoriesCaptured = battles.filter(
      (b) => b.territoryCaptured !== null
    ).length;

    const durationMs = war.endedAt
      ? new Date(war.endedAt) - new Date(war.startedAt)
      : Date.now() - new Date(war.startedAt);
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));

    return {
      war,
      statistics: {
        totalBattles: battles.length,
        attackerVictories,
        defenderVictories,
        draws,
        attackerScore: war.attackerScore,
        defenderScore: war.defenderScore,
        attackerCasualties: war.attackerCasualties || {},
        defenderCasualties: war.defenderCasualties || {},
        totalResourcesPillaged,
        territoriesCaptured,
        territoriesContested: (war.territoriesContested || []).length,
        durationHours,
        status: war.status,
        winner:
          war.winnerAllianceId === war.attackerAllianceId
            ? 'attacker'
            : war.winnerAllianceId === war.defenderAllianceId
            ? 'defender'
            : null,
      },
    };
  }

  /**
   * Obtenir les guerres actives globales (pour affichage global)
   */
  async getActiveWars(options = {}) {
    const { limit = 10, offset = 0 } = options;

    return await AllianceWar.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Alliance,
          as: 'attackerAlliance',
          attributes: ['id', 'nom', 'tag', 'level', 'membre_count'],
        },
        {
          model: Alliance,
          as: 'defenderAlliance',
          attributes: ['id', 'nom', 'tag', 'level', 'membre_count'],
        },
      ],
      order: [['started_at', 'DESC']],
      limit,
      offset,
    });
  }

  /**
   * Compter les guerres actives d'une alliance
   */
  async countActiveWars(allianceId) {
    return await AllianceWar.count({
      where: {
        status: 'active',
        [Op.or]: [
          { attackerAllianceId: allianceId },
          { defenderAllianceId: allianceId },
        ],
      },
    });
  }

  /**
   * Vérifier si une alliance est en guerre avec une autre
   */
  async isAtWar(alliance1Id, alliance2Id) {
    const wars = await this.findActiveWarBetween(alliance1Id, alliance2Id);
    return wars.length > 0;
  }

  /**
   * Proposer un cessez-le-feu
   */
  async proposeCeasefire(warId, proposedBy, terms, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    war.warTerms = {
      ...war.warTerms,
      ceasefireProposal: {
        proposedBy,
        proposedAt: new Date(),
        terms,
        status: 'pending',
      },
    };

    await war.save(options);
    return war;
  }

  /**
   * Accepter ou refuser un cessez-le-feu
   */
  async respondToCeasefire(warId, accepted, transaction = null) {
    const options = transaction ? { transaction } : {};
    const war = await AllianceWar.findByPk(warId);

    if (!war) {
      throw new Error('War not found');
    }

    if (!war.warTerms?.ceasefireProposal) {
      throw new Error('No ceasefire proposal found');
    }

    war.warTerms.ceasefireProposal.status = accepted ? 'accepted' : 'rejected';
    war.warTerms.ceasefireProposal.respondedAt = new Date();

    if (accepted) {
      war.status = 'ceasefire';
    }

    await war.save(options);
    return war;
  }
}

module.exports = AllianceWarRepository;
