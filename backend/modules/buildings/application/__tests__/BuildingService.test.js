const BuildingService = require('../BuildingService');
const Building = require('../../domain/Building');
const ConstructionOrder = require('../../domain/ConstructionOrder');
const ResourcePool = require('../../domain/ResourcePool');

const transactionProvider = async (handler) => handler({
  LOCK: { UPDATE: 'UPDATE' },
  afterCommit: (fn) => fn(),
});

const buildService = (overrides = {}) => new BuildingService({
  buildingRepository: overrides.buildingRepository,
  resourceRepository: overrides.resourceRepository,
  resourceCostRepository: overrides.resourceCostRepository,
  constructionOrderRepository: overrides.constructionOrderRepository,
  entityRepository: overrides.entityRepository,
  // Production `queueEventPublisher.emit` returns a Promise — tests must mock that
  queueEventPublisher: overrides.queueEventPublisher || { emit: jest.fn().mockResolvedValue() },
  cityRepository: overrides.cityRepository,
  transactionProvider,
});

describe('BuildingService', () => {
  test('refuse upgrade when resources are insufficient', async () => {
    const service = buildService({
      cityRepository: { getUserMainCity: jest.fn().mockResolvedValue({ id: 1 }) },
      buildingRepository: {
        findById: jest.fn().mockResolvedValue(new Building({ id: 1, city_id: 1, name: 'Mine de métal', level: 1, version: 0 })),
      },
      entityRepository: { findBuildingEntityByName: jest.fn().mockResolvedValue({ entity_id: 5 }) },
      constructionOrderRepository: {
        countPending: jest.fn().mockResolvedValue(0),
        getLastForCity: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        syncQueue: jest.fn(),
      },
      resourceCostRepository: {
        findByEntityAndLevel: jest.fn().mockResolvedValue([{ resource_type: 'metal', amount: 100 }]),
      },
      resourceRepository: {
        getCityPool: jest.fn().mockResolvedValue(new ResourcePool([{ id: 1, type: 'metal', amount: 50, version: 0 }])),
        update: jest.fn(),
      },
    });

    await expect(service.startUpgrade(10, 1)).rejects.toMatchObject({ status: 400 });
  });

  test('computes next level based on pending queue', async () => {
    const building = new Building({ id: 2, city_id: 3, name: 'Mine de métal', level: 1, version: 1 });
    const resourcePool = new ResourcePool([{ id: 2, type: 'metal', amount: 500, version: 1 }]);
    const costRepo = { findByEntityAndLevel: jest.fn().mockResolvedValue([{ resource_type: 'metal', amount: 50 }]) };

    const service = buildService({
      cityRepository: { getUserMainCity: jest.fn().mockResolvedValue({ id: 3 }) },
      buildingRepository: { findById: jest.fn().mockResolvedValue(building) },
      entityRepository: { findBuildingEntityByName: jest.fn().mockResolvedValue({ entity_id: 9 }) },
      constructionOrderRepository: {
        countPending: jest.fn().mockResolvedValue(2),
        getLastForCity: jest.fn().mockResolvedValue({ slot: 2, finishTime: new Date() }),
        create: jest.fn().mockResolvedValue({ id: 99 }),
        syncQueue: jest.fn(),
      },
      resourceCostRepository: costRepo,
      resourceRepository: {
        getCityPool: jest.fn().mockResolvedValue(resourcePool),
        update: jest.fn().mockResolvedValue(1),
      },
    });

    await service.startUpgrade(5, building.id);
    expect(costRepo.findByEntityAndLevel).toHaveBeenCalledWith(9, 4, expect.any(Object));
  });

  test('collect respects optimistic versioning', async () => {
    const order = new ConstructionOrder({
      id: 7,
      cityId: 4,
      entityId: 15,
      type: 'building',
      status: 'in_progress',
      startTime: new Date(Date.now() - 2000),
      finishTime: new Date(Date.now() - 1000),
      slot: 1,
    });

    const service = buildService({
      cityRepository: { getUserMainCity: jest.fn().mockResolvedValue({ id: 4 }) },
      entityRepository: {
        findById: jest.fn().mockResolvedValue({ entity_name: 'Mine de métal' }),
        findBuildingEntityByName: jest.fn(),
      },
      buildingRepository: {
        findByName: jest.fn().mockResolvedValue(new Building({ id: 1, city_id: 4, name: 'Mine de métal', level: 3, version: 2 })),
        save: jest.fn().mockResolvedValue([0]),
      },
      constructionOrderRepository: {
        findById: jest.fn().mockResolvedValue(order),
        updateStatus: jest.fn(),
        syncQueue: jest.fn(),
      },
      resourceRepository: {},
      resourceCostRepository: {},
    });

    await expect(service.collectConstruction(2, order.id)).rejects.toMatchObject({ status: 409 });
  });
});