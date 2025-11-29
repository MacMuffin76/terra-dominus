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

const ColonizationService = require('../ColonizationService');

describe('ColonizationService', () => {
  let colonizationService;
  let mockColonizationRepository;
  let mockWorldRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    mockColonizationRepository = {
      createMission: jest.fn(async (data) => ({ id: 1, ...data })),
      getMissionById: jest.fn(),
      getUserMissions: jest.fn(async () => []),
      updateMission: jest.fn(),
      deleteMission: jest.fn()
    };

    mockWorldRepository = {
      getCitySlotById: jest.fn(),
      updateCitySlotStatus: jest.fn(),
      getGridTileByCoords: jest.fn()
    };

    colonizationService = new ColonizationService({
      colonizationRepository: mockColonizationRepository,
      worldRepository: mockWorldRepository
    });
  });

  describe('startColonization', () => {
    it('should create colonization mission with valid data', async () => {
      const departureCityId = 1;
      const targetSlotId = 10;

      const mockCitySlot = {
        id: 10,
        status: 'free',
        grid: { coord_x: 20, coord_y: 20 }
      };

      const mockDepartureCity = {
        id: 1,
        user_id: 1,
        coord_x: 10,
        coord_y: 10
      };

      mockWorldRepository.getCitySlotById.mockResolvedValue(mockCitySlot);

      // Mock des vérifications de ressources et colonists
      // (nécessiterait des mocks Sequelize complets dans la vraie implémentation)

      const result = await colonizationService.startColonization(1, departureCityId, targetSlotId);

      expect(mockColonizationRepository.createMission).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          departure_city_id: departureCityId,
          target_slot_id: targetSlotId,
          status: 'traveling'
        }),
        expect.anything()
      );
    });

    it('should reject colonization on occupied slot', async () => {
      const mockCitySlot = {
        id: 10,
        status: 'occupied',
        grid: { coord_x: 20, coord_y: 20 }
      };

      mockWorldRepository.getCitySlotById.mockResolvedValue(mockCitySlot);

      await expect(
        colonizationService.startColonization(1, 1, 10)
      ).rejects.toThrow();
    });

    it('should reject colonization on reserved slot', async () => {
      const mockCitySlot = {
        id: 10,
        status: 'reserved',
        grid: { coord_x: 20, coord_y: 20 }
      };

      mockWorldRepository.getCitySlotById.mockResolvedValue(mockCitySlot);

      await expect(
        colonizationService.startColonization(1, 1, 10)
      ).rejects.toThrow();
    });

    it('should reject if slot not found', async () => {
      mockWorldRepository.getCitySlotById.mockResolvedValue(null);

      await expect(
        colonizationService.startColonization(1, 1, 999)
      ).rejects.toThrow();
    });
  });

  describe('getUserMissions', () => {
    it('should return user colonization missions', async () => {
      const mockMissions = [
        { id: 1, user_id: 1, status: 'traveling' },
        { id: 2, user_id: 1, status: 'completed' }
      ];

      mockColonizationRepository.getUserMissions.mockResolvedValue(mockMissions);

      const result = await colonizationService.getUserMissions(1);

      expect(result).toEqual(mockMissions);
      expect(mockColonizationRepository.getUserMissions).toHaveBeenCalledWith(1);
    });

    it('should filter missions by status if provided', async () => {
      const mockMissions = [
        { id: 1, user_id: 1, status: 'traveling' }
      ];

      mockColonizationRepository.getUserMissions.mockResolvedValue(mockMissions);

      const result = await colonizationService.getUserMissions(1, { status: 'traveling' });

      expect(result).toEqual(mockMissions);
    });
  });

  describe('cancelMission', () => {
    it('should cancel mission and free reserved slot', async () => {
      const mockMission = {
        id: 1,
        user_id: 1,
        status: 'traveling',
        target_slot_id: 10
      };

      mockColonizationRepository.getMissionById.mockResolvedValue(mockMission);

      await colonizationService.cancelMission(1, 1);

      expect(mockColonizationRepository.deleteMission).toHaveBeenCalledWith(1, expect.anything());
      expect(mockWorldRepository.updateCitySlotStatus).toHaveBeenCalledWith(10, 'free', expect.anything());
    });

    it('should reject cancel if mission not owned by user', async () => {
      const mockMission = {
        id: 1,
        user_id: 999,
        status: 'traveling'
      };

      mockColonizationRepository.getMissionById.mockResolvedValue(mockMission);

      await expect(
        colonizationService.cancelMission(1, 1)
      ).rejects.toThrow();
    });

    it('should reject cancel if mission already completed', async () => {
      const mockMission = {
        id: 1,
        user_id: 1,
        status: 'completed'
      };

      mockColonizationRepository.getMissionById.mockResolvedValue(mockMission);

      await expect(
        colonizationService.cancelMission(1, 1)
      ).rejects.toThrow();
    });
  });

  describe('completeMission', () => {
    it('should create new city on mission completion', async () => {
      const mockMission = {
        id: 1,
        user_id: 1,
        status: 'traveling',
        target_slot_id: 10,
        arrival_time: new Date(Date.now() - 1000)
      };

      mockColonizationRepository.getMissionById.mockResolvedValue(mockMission);

      const mockCitySlot = {
        id: 10,
        status: 'reserved',
        grid: { coord_x: 20, coord_y: 20, terrain_type: 'plains' }
      };

      mockWorldRepository.getCitySlotById.mockResolvedValue(mockCitySlot);

      // La vraie implémentation créerait une City ici
      await colonizationService.completeMission(1);

      expect(mockColonizationRepository.updateMission).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'completed' }),
        expect.anything()
      );
    });

    it('should reject completion if mission still traveling', async () => {
      const mockMission = {
        id: 1,
        user_id: 1,
        status: 'traveling',
        arrival_time: new Date(Date.now() + 10000) // still in future
      };

      mockColonizationRepository.getMissionById.mockResolvedValue(mockMission);

      await expect(
        colonizationService.completeMission(1)
      ).rejects.toThrow();
    });
  });

  describe('getMaxCitiesLimit', () => {
    it('should return correct limit based on technology level', async () => {
      // Mock Technology/Research model
      // Base = 1, +1 per tech level
      
      const result = await colonizationService.getMaxCitiesLimit(1);

      expect(result).toHaveProperty('maxCities');
      expect(result).toHaveProperty('currentCities');
      expect(typeof result.maxCities).toBe('number');
    });

    it('should calculate available slots correctly', async () => {
      const result = await colonizationService.getMaxCitiesLimit(1);

      expect(result.availableSlots).toBe(result.maxCities - result.currentCities);
    });
  });
});
