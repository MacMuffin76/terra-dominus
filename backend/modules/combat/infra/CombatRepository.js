const { runWithContext } = require('../../../utils/logger');
const { Op } = require('sequelize');

/**
 * CombatRepository - Gestion des données combat (attaques, espionnage, rapports)
 */
class CombatRepository {
  constructor({ Attack, AttackWave, DefenseReport, SpyMission, City, User, Entity, Unit }) {
    this.Attack = Attack;
    this.AttackWave = AttackWave;
    this.DefenseReport = DefenseReport;
    this.SpyMission = SpyMission;
    this.City = City;
    this.User = User;
    this.Entity = Entity;
    this.Unit = Unit;
  }

  /**
   * Créer une nouvelle attaque avec ses vagues d'unités
   */
  async createAttack(attackData, wavesData, transaction) {
    return runWithContext(async () => {
      const attack = await this.Attack.create(attackData, { transaction });

      if (wavesData && wavesData.length > 0) {
        const waves = wavesData.map(wave => ({
          ...wave,
          attack_id: attack.id
        }));
        await this.AttackWave.bulkCreate(waves, { transaction });
      }

      return attack;
    });
  }

  /**
   * Récupérer une attaque avec toutes ses relations
   */
  async getAttackById(attackId, includeWaves = true) {
    return runWithContext(async () => {
      const include = [
        { model: this.User, as: 'attacker', attributes: ['id', 'username'] },
        { model: this.User, as: 'defender', attributes: ['id', 'username'] },
        { model: this.City, as: 'attackerCity', attributes: ['id', 'name', 'coord_x', 'coord_y'] },
        { model: this.City, as: 'defenderCity', attributes: ['id', 'name', 'coord_x', 'coord_y'] }
      ];

      if (includeWaves) {
        include.push({
          model: this.AttackWave,
          as: 'waves',
          include: [{ model: this.Unit, as: 'unit', attributes: ['id', 'name'] }]
        });
      }

      return this.Attack.findByPk(attackId, { include });
    });
  }

  /**
   * Récupérer les attaques d'un joueur (envoyées ou reçues)
   */
  async getUserAttacks(userId, filters = {}) {
    return runWithContext(async () => {
      const { role, status, limit = 50 } = filters;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (role === 'attacker') {
        where.attacker_user_id = userId;
      } else if (role === 'defender') {
        where.defender_user_id = userId;
      } else {
        // Par défaut, récupérer toutes les attaques liées au joueur
        where[Op.or] = [
          { attacker_user_id: userId },
          { defender_user_id: userId }
        ];
      }

      return this.Attack.findAll({
        where,
        include: [
          { model: this.User, as: 'attacker', attributes: ['id', 'username'] },
          { model: this.User, as: 'defender', attributes: ['id', 'username'] },
          { model: this.City, as: 'attackerCity', attributes: ['id', 'name'] },
          { model: this.City, as: 'defenderCity', attributes: ['id', 'name'] },
          {
            model: this.AttackWave,
            as: 'waves',
            include: [{ model: this.Unit, as: 'unit', attributes: ['id', 'name', 'quantity'] }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit
      });
    });
  }

  /**
   * Récupérer les attaques arrivées (pour le worker)
   */
  async getArrivedAttacks() {
    return runWithContext(async () => {
      return this.Attack.findAll({
        where: {
          status: 'traveling',
          arrival_time: { [Op.lte]: new Date() }
        },
        include: [
          { model: this.City, as: 'attackerCity' },
          { model: this.City, as: 'defenderCity' },
          {
            model: this.AttackWave,
            as: 'waves',
            include: [{ model: this.Unit, as: 'unit' }]
          }
        ]
      });
    });
  }

  /**
   * Récupérer les attaques par statut (pour débloquer les attaques coincées)
   */
  async getAttacksByStatus(status) {
    return runWithContext(async () => {
      return this.Attack.findAll({
        where: { status },
        include: [
          { model: this.City, as: 'attackerCity' },
          { model: this.City, as: 'defenderCity' },
          {
            model: this.AttackWave,
            as: 'waves',
            include: [{ model: this.Unit, as: 'unit' }]
          }
        ]
      });
    });
  }

  /**
   * Mettre à jour le statut d'une attaque
   */
  async updateAttackStatus(attackId, status, additionalData = {}, transaction) {
    return runWithContext(async () => {
      return this.Attack.update(
        { status, ...additionalData },
        { where: { id: attackId }, transaction }
      );
    });
  }

  /**
   * Créer un rapport de défense après combat
   */
  async createDefenseReport(reportData, transaction) {
    return runWithContext(async () => {
      return this.DefenseReport.create(reportData, { transaction });
    });
  }

  /**
   * Récupérer le rapport de défense d'une attaque
   */
  async getDefenseReport(attackId) {
    return runWithContext(async () => {
      return this.DefenseReport.findOne({
        where: { attack_id: attackId },
        include: [{
          model: this.Attack,
          as: 'attack',
          include: [
            { model: this.User, as: 'attacker', attributes: ['id', 'username'] },
            { model: this.User, as: 'defender', attributes: ['id', 'username'] },
            { model: this.City, as: 'attackerCity', attributes: ['id', 'name'] },
            { model: this.City, as: 'defenderCity', attributes: ['id', 'name'] }
          ]
        }]
      });
    });
  }

  /**
   * Annuler une attaque en cours
   */
  async cancelAttack(attackId, transaction) {
    return runWithContext(async () => {
      return this.Attack.update(
        { status: 'cancelled' },
        { where: { id: attackId, status: 'traveling' }, transaction }
      );
    });
  }

  /**
   * Créer une mission d'espionnage
   */
  async createSpyMission(missionData, transaction) {
    return runWithContext(async () => {
      return this.SpyMission.create(missionData, { transaction });
    });
  }

  /**
   * Récupérer une mission d'espionnage par ID
   */
  async getSpyMissionById(missionId) {
    return runWithContext(async () => {
      return this.SpyMission.findByPk(missionId, {
        include: [
          { model: this.User, as: 'spy', attributes: ['id', 'username'] },
          { model: this.User, as: 'target', attributes: ['id', 'username'] },
          { model: this.City, as: 'spyCity', attributes: ['id', 'name'] },
          { model: this.City, as: 'targetCity', attributes: ['id', 'name'] }
        ]
      });
    });
  }

  /**
   * Récupérer les missions d'espionnage d'un utilisateur
   */
  async getUserSpyMissions(userId, filters = {}) {
    return runWithContext(async () => {
      const { role, status, limit = 50 } = filters;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (role === 'spy') {
        where.spy_user_id = userId;
      } else if (role === 'target') {
        where.target_user_id = userId;
        where.detected = true; // Ne montrer que les missions détectées
      } else {
        where.spy_user_id = userId;
      }

      return this.SpyMission.findAll({
        where,
        include: [
          { model: this.User, as: 'spy', attributes: ['id', 'username'] },
          { model: this.User, as: 'target', attributes: ['id', 'username'] },
          { model: this.City, as: 'spyCity', attributes: ['id', 'name'] },
          { model: this.City, as: 'targetCity', attributes: ['id', 'name'] }
        ],
        order: [['created_at', 'DESC']],
        limit
      });
    });
  }

  /**
   * Récupérer les missions d'espionnage arrivées (pour le worker)
   */
  async getArrivedSpyMissions() {
    return runWithContext(async () => {
      return this.SpyMission.findAll({
        where: {
          status: 'traveling',
          arrival_time: { [Op.lte]: new Date() }
        },
        include: [
          { model: this.City, as: 'spyCity' },
          { model: this.City, as: 'targetCity' },
          { model: this.User, as: 'target' }
        ]
      });
    });
  }

  /**
   * Mettre à jour une mission d'espionnage
   */
  async updateSpyMission(missionId, updateData, transaction) {
    return runWithContext(async () => {
      return this.SpyMission.update(
        updateData,
        { where: { id: missionId }, transaction }
      );
    });
  }

  /**
   * Récupérer les unités disponibles dans une ville pour l'attaque/espionnage
   */
  async getCityUnits(cityId) {
    return runWithContext(async () => {
      return this.Unit.findAll({
        where: { city_id: cityId },
        include: [{ model: this.Entity, as: 'entity' }]
      });
    });
  }

  /**
   * Count user's attacks today (for daily limit check)
   */
  async countUserAttacksToday(userId) {
    return runWithContext(async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      return this.Attack.count({
        where: {
          attacker_user_id: userId,
          departure_time: { [Op.gte]: todayStart }
        }
      });
    });
  }

  /**
   * Get last attack from attacker to defender (for raid cooldown check)
   */
  async getLastAttackOnTarget(attackerUserId, defenderUserId) {
    return runWithContext(async () => {
      return this.Attack.findOne({
        where: {
          attacker_user_id: attackerUserId,
          defender_user_id: defenderUserId
        },
        order: [['arrival_time', 'DESC']],
        attributes: ['id', 'arrival_time']
      });
    });
  }
}

module.exports = CombatRepository;
