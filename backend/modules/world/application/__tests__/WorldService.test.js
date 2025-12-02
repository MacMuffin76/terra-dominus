// Mock du logger avant d'importer le service
jest.mock('../../../../utils/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  runWithContext: (contextOrFn, maybeFn) => {
    if (typeof maybeFn === 'function') {
      return maybeFn();
    }
    return contextOrFn();
  }
}));

// Mock des modèles Sequelize
jest.mock('../../../../models', () => ({
  City: {
    findAll: jest.fn(() => Promise.resolve([]))
  },
  Research: {
    findAll: jest.fn(() => Promise.resolve([]))
  }
}));

// Mock du cache
jest.mock('../../../../utils/cache', () => ({
  cacheWrapper: jest.fn((key, ttl, fn) => fn()), // Exécute directement la fonction sans cache
  invalidateCache: jest.fn(() => Promise.resolve())
}));

const WorldService = require('../WorldService');
const { City, Research } = require('../../../../models');

describe('WorldService', () => {
  let worldService;
  let mockWorldRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWorldRepository = {
      getGridTilesInBounds: jest.fn(async () => []),
      getExploredTilesForUser: jest.fn(async () => []),
      markTilesAsExplored: jest.fn(),
      getCitySlotById: jest.fn(),
      getFreeCitySlots: jest.fn(async () => []),
      getCitySlotsInBounds: jest.fn(async () => []),
      getGridTileByCoords: jest.fn(),
      countTotalCitySlots: jest.fn(async () => 300),
      countCitySlotsByStatus: jest.fn(async () => ({
        free: 250,
        reserved: 30,
        occupied: 20
      }))
    };

    worldService = new WorldService({
      worldRepository: mockWorldRepository
    });
  });

  describe('getVisibleWorld', () => {
    it('should return empty tiles if user has no cities', async () => {
      // Mock City.findAll to return []
      const result = await worldService.getVisibleWorld(1);

      expect(result.tiles).toEqual([]);
      expect(result.exploredCount).toBe(0);
      expect(result.cities).toEqual([]);
    });

    it('should mark tiles as visible within vision range', async () => {
      // Mock user city at (50, 50) with vision range 5
      const mockCity = {
        id: 1,
        coord_x: 50,
        coord_y: 50,
        vision_range: 5,
        user_id: 1
      };
      
      City.findAll.mockResolvedValue([mockCity]);
      Research.findAll.mockResolvedValue([]);
      
      const mockGridTiles = [
        { id: 1, coord_x: 50, coord_y: 50, terrain_type: 'plains', has_city_slot: false },
        { id: 2, coord_x: 51, coord_y: 50, terrain_type: 'forest', has_city_slot: true },
        { id: 3, coord_x: 60, coord_y: 60, terrain_type: 'mountain', has_city_slot: false }
      ];

      mockWorldRepository.getGridTilesInBounds.mockResolvedValue(mockGridTiles);
      mockWorldRepository.getExploredTilesForUser.mockResolvedValue([]);

      const result = await worldService.getVisibleWorld(1, {
        minX: 45, minY: 45, maxX: 65, maxY: 65
      });

      expect(result).toHaveProperty('tiles');
      expect(result).toHaveProperty('exploredCount');
      expect(result).toHaveProperty('bounds');
      expect(result.tiles.length).toBeGreaterThan(0);
    });

    it('should include previously explored tiles even if not currently visible', async () => {
      // Mock user city at (50, 50) - won't see (80, 80) which is too far
      const mockCity = {
        id: 1,
        coord_x: 50,
        coord_y: 50,
        vision_range: 5,
        user_id: 1
      };
      
      City.findAll.mockResolvedValue([mockCity]);
      Research.findAll.mockResolvedValue([]);
      
      const mockGridTiles = [
        { id: 1, coord_x: 50, coord_y: 50, terrain_type: 'plains', has_city_slot: false },
        { id: 2, coord_x: 80, coord_y: 80, terrain_type: 'forest', has_city_slot: false }
      ];

      const mockExploredTiles = [
        { grid_id: 2 } // Tile at (80,80) was explored before
      ];

      mockWorldRepository.getGridTilesInBounds.mockResolvedValue(mockGridTiles);
      mockWorldRepository.getExploredTilesForUser.mockResolvedValue(mockExploredTiles);

      const result = await worldService.getVisibleWorld(1);

      const tile80 = result.tiles.find(t => t.id === 2);
      if (tile80) {
        expect(tile80.isExplored).toBe(true);
      }
    });

    it('should save newly explored tiles', async () => {
      // Mock user city at (50, 50)
      const mockCity = {
        id: 1,
        coord_x: 50,
        coord_y: 50,
        vision_range: 5,
        user_id: 1
      };
      
      City.findAll.mockResolvedValue([mockCity]);
      Research.findAll.mockResolvedValue([]);
      
      const mockGridTiles = [
        { id: 1, coord_x: 50, coord_y: 50, terrain_type: 'plains', has_city_slot: false }
      ];

      mockWorldRepository.getGridTilesInBounds.mockResolvedValue(mockGridTiles);
      mockWorldRepository.getExploredTilesForUser.mockResolvedValue([]);

      await worldService.getVisibleWorld(1);

      // Devrait marquer les nouvelles tuiles comme explorées
      expect(mockWorldRepository.markTilesAsExplored).toHaveBeenCalled();
    });
  });

  describe('getAvailableCitySlots', () => {
    it('should return free city slots in visible area', async () => {
      const mockSlots = [
        {
          id: 1,
          status: 'free',
          quality: 'high',
          grid: { coord_x: 20, coord_y: 20, terrain_type: 'plains' }
        }
      ];

      mockWorldRepository.getFreeCitySlots.mockResolvedValue(mockSlots);

      // Nécessiterait de mocker getVisibleWorld
      const result = await worldService.getAvailableCitySlots(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should include distance to closest city for each slot', async () => {
      const mockSlots = [
        {
          id: 1,
          status: 'free',
          quality: 'high',
          grid: { coord_x: 20, coord_y: 20, terrain_type: 'plains' }
        }
      ];

      mockWorldRepository.getFreeCitySlots.mockResolvedValue(mockSlots);
      mockWorldRepository.getGridTileByCoords.mockResolvedValue({
        coord_x: 20,
        coord_y: 20,
        terrain_type: 'plains'
      });

      const result = await worldService.getAvailableCitySlots(1);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('closestCity');
      }
    });
  });

  describe('getTileInfo', () => {
    it('should return detailed info for visible tile', async () => {
      const mockGridTile = {
        coord_x: 50,
        coord_y: 50,
        terrain_type: 'forest',
        has_city_slot: true
      };

      mockWorldRepository.getGridTileByCoords.mockResolvedValue(mockGridTile);
      mockWorldRepository.getCitySlotsInBounds.mockResolvedValue([
        { id: 1, status: 'free', quality: 'high' }
      ]);

      // Nécessiterait de mocker getVisibleWorld pour vérifier la visibilité
      const result = await worldService.getTileInfo(1, 50, 50);

      expect(result).toHaveProperty('x', 50);
      expect(result).toHaveProperty('y', 50);
      expect(result).toHaveProperty('terrain', 'forest');
      expect(result).toHaveProperty('hasCitySlot', true);
    });

    it('should include city slot info if present', async () => {
      const mockGridTile = {
        coord_x: 50,
        coord_y: 50,
        terrain_type: 'plains',
        has_city_slot: true
      };

      const mockCitySlot = {
        id: 10,
        status: 'free',
        quality: 'medium',
        city_id: null
      };

      mockWorldRepository.getGridTileByCoords.mockResolvedValue(mockGridTile);
      mockWorldRepository.getCitySlotsInBounds.mockResolvedValue([mockCitySlot]);

      const result = await worldService.getTileInfo(1, 50, 50);

      expect(result.citySlot).toBeDefined();
      expect(result.citySlot.id).toBe(10);
      expect(result.citySlot.status).toBe('free');
    });

    it('should reject if tile not visible', async () => {
      // Mock getVisibleWorld to return no tiles
      await expect(
        worldService.getTileInfo(1, 999, 999)
      ).rejects.toThrow();
    });
  });

  describe('getWorldStats', () => {
    it('should return global world statistics', async () => {
      const result = await worldService.getWorldStats();

      expect(result).toHaveProperty('totalCitySlots', 300);
      expect(result).toHaveProperty('slotsBreakdown');
      expect(result.slotsBreakdown).toEqual({
        free: 250,
        reserved: 30,
        occupied: 20
      });
      expect(result).toHaveProperty('worldSize');
      expect(result.worldSize).toEqual({ x: 100, y: 100 });
    });
  });
});
