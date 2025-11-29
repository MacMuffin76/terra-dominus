// Mock du logger avant d'importer le service
jest.mock('../../../../utils/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  // runWithContext peut être appelé avec 1 arg (fn) ou 2 args (context, fn)
  runWithContext: (contextOrFn, maybeFn) => {
    if (typeof maybeFn === 'function') {
      return maybeFn(); // Cas avec 2 args: runWithContext(context, fn)
    }
    return contextOrFn(); // Cas avec 1 arg: runWithContext(fn)
  }
}));

const TradeService = require('../TradeService');

const mockSequelize = {
  transaction: jest.fn(async () => ({
    commit: jest.fn(),
    rollback: jest.fn()
  }))
};

describe('TradeService', () => {
  let tradeService;
  let mockTradeRepository;
  let mockCity;
  let mockResource;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTradeRepository = {
      createTradeRoute: jest.fn(async (data) => ({ id: 1, ...data })),
      getTradeRouteById: jest.fn(),
      getUserTradeRoutes: jest.fn(async () => []),
      getRoutesReadyForAutoTransfer: jest.fn(async () => []),
      createConvoy: jest.fn()
    };

    mockCity = {
      findByPk: jest.fn(),
      findAll: jest.fn()
    };

    mockResource = {
      findOne: jest.fn(async () => ({
        gold: 5000,
        metal: 3000,
        fuel: 2000,
        save: jest.fn()
      })),
      update: jest.fn()
    };

    tradeService = new TradeService({
      tradeRepository: mockTradeRepository,
      City: mockCity,
      Resource: mockResource,
      sequelize: mockSequelize
    });
  });

  describe('establishTradeRoute', () => {
    it('should create a valid internal trade route', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 2,
        routeType: 'internal',
        autoTransferConfig: {
          auto_transfer_enabled: true,
          auto_transfer_gold: 100
        }
      };

      mockCity.findByPk
        .mockResolvedValueOnce({ id: 1, user_id: 1, coord_x: 0, coord_y: 0 })
        .mockResolvedValueOnce({ id: 2, user_id: 1, coord_x: 5, coord_y: 5 });

      const result = await tradeService.establishTradeRoute(1, routeData);

      expect(mockTradeRepository.createTradeRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_user_id: 1,
          origin_city_id: 1,
          destination_city_id: 2,
          route_type: 'internal',
          status: 'active',
          distance: 10
        }),
        expect.anything()
      );

      expect(result).toHaveProperty('id', 1);
    });

    it('should reject route to same city', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 1,
        routeType: 'internal',
        autoTransferConfig: {}
      };

      mockCity.findByPk.mockResolvedValue({ id: 1, user_id: 1, coord_x: 0, coord_y: 0 });

      await expect(
        tradeService.establishTradeRoute(1, routeData)
      ).rejects.toThrow('Impossible de créer une route vers la même ville');
    });

    it('should reject internal route to enemy city', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 2,
        routeType: 'internal',
        autoTransferConfig: {}
      };

      mockCity.findByPk
        .mockResolvedValueOnce({ id: 1, user_id: 1, coord_x: 0, coord_y: 0 })
        .mockResolvedValueOnce({ id: 2, user_id: 999, coord_x: 5, coord_y: 5 });

      await expect(
        tradeService.establishTradeRoute(1, routeData)
      ).rejects.toThrow('Les routes internes doivent relier vos propres villes');
    });

    it('should reject duplicate route', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 2,
        routeType: 'internal',
        autoTransferConfig: {}
      };

      mockCity.findByPk
        .mockResolvedValueOnce({ id: 1, user_id: 1, coord_x: 0, coord_y: 0 })
        .mockResolvedValueOnce({ id: 2, user_id: 1, coord_x: 5, coord_y: 5 });

      mockTradeRepository.getUserTradeRoutes.mockResolvedValue([
        { origin_city_id: 1, destination_city_id: 2 }
      ]);

      await expect(
        tradeService.establishTradeRoute(1, routeData)
      ).rejects.toThrow('Une route existe déjà entre ces villes');
    });

    it('should calculate correct distance', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 2,
        routeType: 'internal',
        autoTransferConfig: {}
      };

      mockCity.findByPk
        .mockResolvedValueOnce({ id: 1, user_id: 1, coord_x: 0, coord_y: 0 })
        .mockResolvedValueOnce({ id: 2, user_id: 1, coord_x: 10, coord_y: 10 });

      await tradeService.establishTradeRoute(1, routeData);

      expect(mockTradeRepository.createTradeRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          distance: 20 // Manhattan distance
        }),
        expect.anything()
      );
    });
  });

  describe('sendConvoy', () => {
    it('should send convoy with sufficient resources', async () => {
      const convoyData = {
        routeId: 1,
        cargo: { gold: 500, metal: 300, fuel: 100 },
        escortUnits: []
      };

      const mockRoute = {
        id: 1,
        owner_user_id: 1,
        origin_city_id: 1,
        destination_city_id: 2,
        status: 'active',
        distance: 10
      };

      mockTradeRepository.getTradeRouteById.mockResolvedValue(mockRoute);

      const mockOriginResources = {
        gold: 5000,
        metal: 3000,
        fuel: 2000,
        save: jest.fn()
      };

      mockResource.findOne.mockResolvedValue(mockOriginResources);

      await tradeService.sendConvoy(1, convoyData);

      expect(mockOriginResources.gold).toBe(4500);
      expect(mockOriginResources.metal).toBe(2700);
      expect(mockOriginResources.fuel).toBe(1900);
      expect(mockOriginResources.save).toHaveBeenCalled();
    });

    it('should reject convoy with insufficient resources', async () => {
      const convoyData = {
        routeId: 1,
        cargo: { gold: 10000, metal: 300, fuel: 100 },
        escortUnits: []
      };

      const mockRoute = {
        id: 1,
        owner_user_id: 1,
        origin_city_id: 1,
        status: 'active'
      };

      mockTradeRepository.getTradeRouteById.mockResolvedValue(mockRoute);

      const mockOriginResources = {
        gold: 500,
        metal: 3000,
        fuel: 2000
      };

      mockResource.findOne.mockResolvedValue(mockOriginResources);

      await expect(
        tradeService.sendConvoy(1, convoyData)
      ).rejects.toThrow('Ressources insuffisantes');
    });

    it('should reject convoy on inactive route', async () => {
      const convoyData = {
        routeId: 1,
        cargo: { gold: 500, metal: 300, fuel: 100 },
        escortUnits: []
      };

      const mockRoute = {
        id: 1,
        owner_user_id: 1,
        status: 'inactive'
      };

      mockTradeRepository.getTradeRouteById.mockResolvedValue(mockRoute);

      await expect(
        tradeService.sendConvoy(1, convoyData)
      ).rejects.toThrow('Route inactive');
    });

    it('should reject convoy on unauthorized route', async () => {
      const convoyData = {
        routeId: 1,
        cargo: { gold: 500, metal: 300, fuel: 100 },
        escortUnits: []
      };

      const mockRoute = {
        id: 1,
        owner_user_id: 999,
        status: 'active'
      };

      mockTradeRepository.getTradeRouteById.mockResolvedValue(mockRoute);

      await expect(
        tradeService.sendConvoy(1, convoyData)
      ).rejects.toThrow('Route commerciale introuvable ou non autorisée');
    });
  });

  describe('transaction handling', () => {
    it('should rollback on error', async () => {
      const routeData = {
        originCityId: 1,
        destinationCityId: 2,
        routeType: 'internal',
        autoTransferConfig: {}
      };

      mockCity.findByPk.mockRejectedValue(new Error('Database error'));

      const transaction = await mockSequelize.transaction();

      await expect(
        tradeService.establishTradeRoute(1, routeData)
      ).rejects.toThrow('Database error');

      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
