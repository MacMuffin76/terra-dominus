const { getLogger } = require('../../../utils/logger');
const { cacheWrapper, invalidateCache } = require('../../../utils/cache');
const City = require('../../../models/City');
const Research = require('../../../models/Research');
const {
  calculateDistance,
  getVisibleTilesFromPoint,
  calculateVisionRange,
  DEFAULT_VISION_RANGE,
  isValidCoordinate,
  TERRAIN_BONUSES,
} = require('../domain/worldRules');

const logger = getLogger({ module: 'WorldService' });

/**
 * WorldService - Service métier pour la gestion de la carte du monde
 */
class WorldService {
  constructor({ worldRepository }) {
    this.worldRepository = worldRepository;
  }

  /**
   * Récupère la portion visible de la carte pour un joueur
   * Applique le fog of war basé sur les villes du joueur
   * @cache 5 minutes TTL
   */
  async getVisibleWorld(userId, bounds = null) {
    const cacheKey = `world:visible:${userId}:${JSON.stringify(bounds || {})}`;
    
    return cacheWrapper(cacheKey, 300, async () => {
      return this._getVisibleWorldUncached(userId, bounds);
    });
  }

  /**
   * Version non-cachée de getVisibleWorld (logique interne)
   */
  async _getVisibleWorldUncached(userId, bounds = null) {
    try {
      // Récupérer les villes du joueur
      const userCities = await City.findAll({
        where: { user_id: userId },
        attributes: ['id', 'coord_x', 'coord_y', 'vision_range'],
      });

      if (userCities.length === 0) {
        return {
          tiles: [],
          exploredCount: 0,
          cities: [],
        };
      }

      // Récupérer les recherches du joueur pour calculer le bonus de vision
      const userResearches = await Research.findAll({
        where: { user_id: userId },
        attributes: ['name', 'level'],
      });

      // Calculer toutes les cases visibles depuis les villes
      const visibleCoords = new Set();
      const cityVisionRanges = [];

      for (const city of userCities) {
        if (city.coord_x === null || city.coord_y === null) continue;

        const visionRange = calculateVisionRange(
          city.vision_range || DEFAULT_VISION_RANGE,
          userResearches
        );

        cityVisionRanges.push({
          cityId: city.id,
          x: city.coord_x,
          y: city.coord_y,
          range: visionRange,
        });

        const visibleTiles = getVisibleTilesFromPoint(
          city.coord_x,
          city.coord_y,
          visionRange
        );

        visibleTiles.forEach((tile) => {
          // Filtrer les coordonnées invalides (hors carte)
          if (isValidCoordinate(tile.x, tile.y, 100, 100)) {
            visibleCoords.add(`${tile.x},${tile.y}`);
          }
        });
      }

      // Définir les bounds si non fournis
      let minX = 0, minY = 0, maxX = 99, maxY = 99;
      if (bounds) {
        minX = bounds.minX || 0;
        minY = bounds.minY || 0;
        maxX = bounds.maxX || 99;
        maxY = bounds.maxY || 99;
      }

      // Récupérer les tiles de la grille dans les bounds
      const gridTiles = await this.worldRepository.getGridTilesInBounds(
        minX, minY, maxX, maxY
      );

      // Récupérer les cases déjà explorées par le joueur
      const gridIds = gridTiles.map((t) => t.id);
      const exploredTiles = await this.worldRepository.getExploredTilesForUser(
        userId,
        gridIds
      );
      const exploredGridIds = new Set(exploredTiles.map((e) => e.grid_id));

      // Filtrer et enrichir les tiles
      const visibleTiles = [];
      const newlyExploredIds = [];

      for (const tile of gridTiles) {
        const coordKey = `${tile.coord_x},${tile.coord_y}`;
        const isCurrentlyVisible = visibleCoords.has(coordKey);
        const wasExplored = exploredGridIds.has(tile.id);

        if (isCurrentlyVisible || wasExplored) {
          visibleTiles.push({
            id: tile.id,
            x: tile.coord_x,
            y: tile.coord_y,
            terrain: tile.terrain_type,
            hasCitySlot: tile.has_city_slot,
            isVisible: isCurrentlyVisible,
            isExplored: wasExplored || isCurrentlyVisible,
          });

          // Marquer comme explorée si visible mais pas encore explorée
          if (isCurrentlyVisible && !wasExplored) {
            newlyExploredIds.push(tile.id);
          }
        }
      }

      // Sauvegarder les nouvelles explorations
      if (newlyExploredIds.length > 0) {
        await this.worldRepository.markTilesAsExplored(userId, newlyExploredIds);
        logger.info(`User ${userId} explored ${newlyExploredIds.length} new tiles`);
        
        // Invalider le cache pour cet utilisateur
        await invalidateCache(`world:visible:${userId}:*`);
      }

      return {
        tiles: visibleTiles,
        exploredCount: exploredTiles.length + newlyExploredIds.length,
        visionRanges: cityVisionRanges,
        bounds: { minX, minY, maxX, maxY },
      };
    } catch (error) {
      logger.error({ err: error, userId }, 'Error getting visible world');
      throw error;
    }
  }

  /**
   * Récupère les emplacements de villes disponibles dans la zone visible
   */
  async getAvailableCitySlots(userId) {
    try {
      // Récupérer la zone visible du joueur
      const visibleWorld = await this.getVisibleWorld(userId);
      const visibleTileIds = visibleWorld.tiles.map((t) => t.id);

      // Récupérer les emplacements libres dans cette zone
      const freeslots = await this.worldRepository.getFreeCitySlots(visibleTileIds);

      // Récupérer les villes du joueur pour calculer les distances
      const userCities = await City.findAll({
        where: { user_id: userId },
        attributes: ['id', 'name', 'coord_x', 'coord_y'],
      });

      // Enrichir chaque slot avec des infos supplémentaires
      const enrichedSlots = await Promise.all(
        freeslots.map(async (slot) => {
          const grid = slot.grid || (await this.worldRepository.getGridTileByCoords(
            slot.grid?.coord_x,
            slot.grid?.coord_y
          ));

          // Trouver la ville la plus proche
          let closestCity = null;
          let minDistance = Infinity;

          for (const city of userCities) {
            if (city.coord_x !== null && city.coord_y !== null) {
              const dist = calculateDistance(
                city.coord_x,
                city.coord_y,
                grid.coord_x,
                grid.coord_y
              );

              if (dist < minDistance) {
                minDistance = dist;
                closestCity = {
                  id: city.id,
                  name: city.name,
                  distance: dist,
                };
              }
            }
          }

          return {
            id: slot.id,
            x: grid.coord_x,
            y: grid.coord_y,
            terrain: grid.terrain_type,
            quality: slot.quality,
            status: slot.status,
            closestCity,
            terrainInfo: TERRAIN_BONUSES[grid.terrain_type],
          };
        })
      );

      return enrichedSlots;
    } catch (error) {
      logger.error({ err: error, userId }, 'Error getting available city slots');
      throw error;
    }
  }

  /**
   * Récupère les informations détaillées d'une case spécifique
   */
  async getTileInfo(userId, x, y) {
    try {
      // Vérifier que la case est visible/explorée par le joueur
      const visibleWorld = await this.getVisibleWorld(userId);
      const tile = visibleWorld.tiles.find((t) => t.x === x && t.y === y);

      if (!tile) {
        const error = new Error('Cette case n\'est pas visible ou n\'existe pas');
        error.status = 404;
        throw error;
      }

      const gridTile = await this.worldRepository.getGridTileByCoords(x, y);

      // Récupérer le city slot si présent
      let citySlotInfo = null;
      if (gridTile.has_city_slot) {
        const slots = await this.worldRepository.getCitySlotsInBounds(x, y, x, y);
        if (slots.length > 0) {
          const slot = slots[0];
          citySlotInfo = {
            id: slot.id,
            status: slot.status,
            quality: slot.quality,
            cityId: slot.city_id,
          };
        }
      }

      return {
        x: gridTile.coord_x,
        y: gridTile.coord_y,
        terrain: gridTile.terrain_type,
        hasCitySlot: gridTile.has_city_slot,
        citySlot: citySlotInfo,
        terrainInfo: TERRAIN_BONUSES[gridTile.terrain_type],
        isVisible: tile.isVisible,
        isExplored: tile.isExplored,
      };
    } catch (error) {
      logger.error({ err: error, userId, x, y }, 'Error getting tile info');
      throw error;
    }
  }

  /**
   * Récupère les statistiques globales de la carte
   */
  async getWorldStats() {
    try {
      const totalSlots = await this.worldRepository.countTotalCitySlots();
      const slotsByStatus = await this.worldRepository.countCitySlotsByStatus();

      return {
        totalCitySlots: totalSlots,
        slotsBreakdown: slotsByStatus,
        worldSize: { x: 100, y: 100 },
      };
    } catch (error) {
      logger.error({ err: error }, 'Error getting world stats');
      throw error;
    }
  }
}

module.exports = WorldService;
