const { Op } = require('sequelize');
const WorldGrid = require('../../../models/WorldGrid');
const CitySlot = require('../../../models/CitySlot');
const ExploredTile = require('../../../models/ExploredTile');

/**
 * WorldRepository - Gestion de l'accès aux données de la carte du monde
 */
class WorldRepository {
  /**
   * Récupère une case de la grille par coordonnées
   */
  async getGridTileByCoords(x, y) {
    return await WorldGrid.findOne({
      where: { coord_x: x, coord_y: y },
    });
  }

  /**
   * Récupère toutes les cases dans une zone rectangulaire
   */
  async getGridTilesInBounds(minX, minY, maxX, maxY) {
    return await WorldGrid.findAll({
      where: {
        coord_x: { [Op.between]: [minX, maxX] },
        coord_y: { [Op.between]: [minY, maxY] },
      },
      order: [['coord_y', 'ASC'], ['coord_x', 'ASC']],
    });
  }

  /**
   * Récupère les cases explorées par un joueur dans une zone
   */
  async getExploredTilesForUser(userId, gridIds = null) {
    const where = { user_id: userId };
    if (gridIds) {
      where.grid_id = { [Op.in]: gridIds };
    }

    return await ExploredTile.findAll({
      where,
      attributes: ['grid_id', 'explored_at'],
    });
  }

  /**
   * Marque une case comme explorée pour un joueur
   */
  async markTileAsExplored(userId, gridId, transaction = null) {
    const [tile, created] = await ExploredTile.findOrCreate({
      where: {
        user_id: userId,
        grid_id: gridId,
      },
      defaults: {
        user_id: userId,
        grid_id: gridId,
        explored_at: new Date(),
      },
      transaction,
    });

    return { tile, created };
  }

  /**
   * Marque plusieurs cases comme explorées (bulk)
   */
  async markTilesAsExplored(userId, gridIds, transaction = null) {
    const existingExplored = await ExploredTile.findAll({
      where: {
        user_id: userId,
        grid_id: { [Op.in]: gridIds },
      },
      attributes: ['grid_id'],
      transaction,
    });

    const existingGridIds = new Set(existingExplored.map((e) => e.grid_id));
    const newGridIds = gridIds.filter((id) => !existingGridIds.has(id));

    if (newGridIds.length > 0) {
      const tilesToCreate = newGridIds.map((gridId) => ({
        user_id: userId,
        grid_id: gridId,
        explored_at: new Date(),
      }));

      await ExploredTile.bulkCreate(tilesToCreate, {
        ignoreDuplicates: true,
        transaction,
      });
    }

    return newGridIds.length;
  }

  /**
   * Récupère un emplacement de ville par ID
   */
  async getCitySlotById(slotId) {
    return await CitySlot.findByPk(slotId, {
      include: [
        {
          model: WorldGrid,
          as: 'grid',
          attributes: ['coord_x', 'coord_y', 'terrain_type'],
        },
      ],
    });
  }

  /**
   * Récupère tous les emplacements de villes dans une zone
   */
  async getCitySlotsInBounds(minX, minY, maxX, maxY) {
    const grids = await WorldGrid.findAll({
      where: {
        coord_x: { [Op.between]: [minX, maxX] },
        coord_y: { [Op.between]: [minY, maxY] },
        has_city_slot: true,
      },
      attributes: ['id'],
    });

    const gridIds = grids.map((g) => g.id);

    return await CitySlot.findAll({
      where: {
        grid_id: { [Op.in]: gridIds },
      },
    });
  }

  /**
   * Récupère les emplacements libres pour colonisation
   */
  async getFreeCitySlots(gridIds = null) {
    const where = { status: 'free' };
    if (gridIds) {
      where.grid_id = { [Op.in]: gridIds };
    }

    return await CitySlot.findAll({
      where,
      include: [
        {
          model: WorldGrid,
          as: 'grid',
          attributes: ['coord_x', 'coord_y', 'terrain_type'],
        },
      ],
    });
  }

  /**
   * Met à jour le statut d'un emplacement de ville
   */
  async updateCitySlotStatus(slotId, status, cityId = null, transaction = null) {
    const updates = { status, updated_at: new Date() };
    if (cityId !== null) {
      updates.city_id = cityId;
    }

    const [affectedRows] = await CitySlot.update(updates, {
      where: { id: slotId },
      transaction,
    });

    return affectedRows > 0;
  }

  /**
   * Compte le nombre total d'emplacements de villes
   */
  async countTotalCitySlots() {
    return await CitySlot.count();
  }

  /**
   * Compte les emplacements par statut
   */
  async countCitySlotsByStatus() {
    const results = await CitySlot.findAll({
      attributes: [
        'status',
        [WorldGrid.sequelize.fn('COUNT', WorldGrid.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    return results.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  }
}

module.exports = WorldRepository;
