const { Op } = require('sequelize');
const ColonizationMission = require('../../../models/ColonizationMission');
const City = require('../../../models/City');
const CitySlot = require('../../../models/CitySlot');
const WorldGrid = require('../../../models/WorldGrid');

/**
 * ColonizationRepository - Gestion de l'accès aux données de colonisation
 */
class ColonizationRepository {
  /**
   * Crée une nouvelle mission de colonisation
   */
  async createMission(missionData, transaction = null) {
    return await ColonizationMission.create(missionData, { transaction });
  }

  /**
   * Récupère une mission par ID
   */
  async getMissionById(missionId) {
    return await ColonizationMission.findByPk(missionId, {
      include: [
        {
          model: City,
          as: 'departureCity',
          attributes: ['id', 'name', 'coord_x', 'coord_y'],
        },
        {
          model: CitySlot,
          as: 'targetSlot',
          include: [
            {
              model: WorldGrid,
              as: 'grid',
              attributes: ['coord_x', 'coord_y', 'terrain_type'],
            },
          ],
        },
      ],
    });
  }

  /**
   * Récupère toutes les missions d'un joueur
   */
  async getMissionsByUser(userId, status = null) {
    const where = { user_id: userId };
    if (status) {
      where.status = status;
    }

    return await ColonizationMission.findAll({
      where,
      include: [
        {
          model: City,
          as: 'departureCity',
          attributes: ['id', 'name', 'coord_x', 'coord_y'],
        },
        {
          model: CitySlot,
          as: 'targetSlot',
          include: [
            {
              model: WorldGrid,
              as: 'grid',
              attributes: ['coord_x', 'coord_y', 'terrain_type'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Récupère les missions actives (traveling)
   */
  async getActiveMissions(userId = null) {
    const where = { status: 'traveling' };
    if (userId) {
      where.user_id = userId;
    }

    return await ColonizationMission.findAll({
      where,
      include: [
        {
          model: City,
          as: 'departureCity',
          attributes: ['id', 'name'],
        },
        {
          model: CitySlot,
          as: 'targetSlot',
          attributes: ['id'],
        },
      ],
      order: [['arrival_at', 'ASC']],
    });
  }

  /**
   * Récupère les missions arrivées (à traiter)
   */
  async getArrivedMissions() {
    return await ColonizationMission.findAll({
      where: {
        status: 'traveling',
        arrival_at: { [Op.lte]: new Date() },
      },
      include: [
        {
          model: City,
          as: 'departureCity',
        },
        {
          model: CitySlot,
          as: 'targetSlot',
          include: [
            {
              model: WorldGrid,
              as: 'grid',
            },
          ],
        },
      ],
      order: [['arrival_at', 'ASC']],
    });
  }

  /**
   * Met à jour le statut d'une mission
   */
  async updateMissionStatus(missionId, status, completedAt = null, transaction = null) {
    const updates = {
      status,
      updated_at: new Date(),
    };

    if (completedAt) {
      updates.completed_at = completedAt;
    }

    const [affectedRows] = await ColonizationMission.update(updates, {
      where: { id: missionId },
      transaction,
    });

    return affectedRows > 0;
  }

  /**
   * Annule une mission (si encore en voyage)
   */
  async cancelMission(missionId, userId, transaction = null) {
    const [affectedRows] = await ColonizationMission.update(
      {
        status: 'cancelled',
        completed_at: new Date(),
        updated_at: new Date(),
      },
      {
        where: {
          id: missionId,
          user_id: userId,
          status: 'traveling',
        },
        transaction,
      }
    );

    return affectedRows > 0;
  }

  /**
   * Compte les missions actives d'un joueur
   */
  async countActiveMissionsByUser(userId) {
    return await ColonizationMission.count({
      where: {
        user_id: userId,
        status: { [Op.in]: ['traveling', 'arrived'] },
      },
    });
  }

  /**
   * Vérifie si un slot a déjà une mission en cours
   */
  async hasPendingMissionToSlot(slotId) {
    const count = await ColonizationMission.count({
      where: {
        target_slot_id: slotId,
        status: { [Op.in]: ['traveling', 'arrived'] },
      },
    });

    return count > 0;
  }
}

module.exports = ColonizationRepository;
