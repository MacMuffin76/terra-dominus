const Building = require('../domain/Building');
const ConstructionOrder = require('../domain/ConstructionOrder');
const assertOptimisticUpdate = require('../infra/assertOptimisticUpdate');
const {
  removeConstructionJob,
  scheduleActiveConstruction,
} = require('../../../jobs/constructionQueue');
const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'BuildingService' });

class BuildingService {
  constructor({
    buildingRepository,
    resourceRepository,
    resourceCostRepository,
    constructionOrderRepository,
    entityRepository,
    queueEventPublisher,
    cityRepository,
    transactionProvider,
  }) {
    this.buildingRepository = buildingRepository;
    this.resourceRepository = resourceRepository;
    this.resourceCostRepository = resourceCostRepository;
    this.constructionOrderRepository = constructionOrderRepository;
    this.entityRepository = entityRepository;
    this.queueEventPublisher = queueEventPublisher;
    this.cityRepository = cityRepository;
    this.transactionProvider = transactionProvider;
  }

  async withCity(userId, transactionOptions = {}) {
    const city = await this.cityRepository.getUserMainCity(userId, transactionOptions);
    if (!city) {
@@ -85,51 +88,51 @@ class BuildingService {

      const pending = await this.constructionOrderRepository.countPending(city.id, entity.entity_id, transaction);
      const nextLevel = building.getNextLevel(pending);
      const costs = await this.resourceCostRepository.findByEntityAndLevel(entity.entity_id, nextLevel, { transaction });
      const pool = await this.resourceRepository.getCityPool(city.id, { transaction, lock: transaction.LOCK.UPDATE });

      const newPool = pool.spend(costs);
      await newPool.persist(this.resourceRepository, transaction);

      const duration = building.getUpgradeDuration(nextLevel);
      const lastOrder = await this.constructionOrderRepository.getLastForCity(city.id, transaction);
      const order = ConstructionOrder.schedule({
        cityId: city.id,
        entityId: entity.entity_id,
        type: 'building',
        durationSeconds: duration,
        lastOrderSlot: lastOrder?.slot,
        lastFinishTime: lastOrder?.finishTime,
      });

      const created = await this.constructionOrderRepository.create(order, transaction);
      await this.constructionOrderRepository.syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        scheduleActiveConstruction(city.id, city.user_id).catch((err) => {
          logger.error({ err, cityId: city.id, userId }, 'Failed to schedule construction completion');
        });
        this.queueEventPublisher.emit(city.id, userId).catch(() => {});
      });


      return created;
    });
  }

  async listConstructionQueue(userId) {
    const city = await this.withCity(userId);
    return this.constructionOrderRepository.findQueue(city.id);
  }

  async cancelConstruction(userId, queueId) {
    return this.transactionProvider(async (transaction) => {
      const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
      const order = await this.constructionOrderRepository.findById(queueId, { transaction, lock: transaction.LOCK.UPDATE });

      if (!order || order.cityId !== city.id) {
        const error = new Error('Construction introuvable');
        error.status = 404;
        throw error;
      }

      if (order.status === 'in_progress') {
        const error = new Error('Impossible d’annuler une construction en cours');
        error.status = 400;
        throw error;
      }

      const cancelled = new ConstructionOrder({ ...order, status: 'cancelled' });
      await this.constructionOrderRepository.updateStatus(cancelled, transaction);
      await this.constructionOrderRepository.syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        removeConstructionJob(queueId).catch(() => {});
        scheduleActiveConstruction(city.id, city.user_id).catch(() => {});
        this.queueEventPublisher.emit(city.id, userId).catch(() => {});
      });

      return cancelled;
    });
  }

  async collectConstruction(userId, queueId) {
    return this.transactionProvider(async (transaction) => {
      const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
      const order = await this.constructionOrderRepository.findById(queueId, { transaction, lock: transaction.LOCK.UPDATE });

      if (!order || order.cityId !== city.id) {
        const error = new Error('Construction introuvable');
        error.status = 404;
        throw error;
      }

      if (!order.isReady()) {
        const error = new Error('La construction n’est pas terminée');
        error.status = 400;
        throw error;
      }

      const entity = await this.entityRepository.findById(order.entityId, { transaction });
      if (!entity) {
        const error = new Error('Entité introuvable');
        error.status = 404;
        throw error;
      }

      const building = await this.buildingRepository.findByName(city.id, entity.entity_name, { transaction, lock: transaction.LOCK.UPDATE });
      if (!building) {
        const error = new Error('Building not found');
        error.status = 404;
        throw error;
      }

      const upgraded = building.incrementLevel();
      const [affected] = await this.buildingRepository.save(upgraded, transaction);
      assertOptimisticUpdate(affected);

      const completedOrder = order.markCompleted();
      await this.constructionOrderRepository.updateStatus(completedOrder, transaction);
      await this.constructionOrderRepository.syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        removeConstructionJob(order.id).catch(() => {});
        scheduleActiveConstruction(city.id, city.user_id).catch(() => {});
        this.queueEventPublisher.emit(city.id, userId).catch(() => {});
      });

      return new Building({ ...upgraded });
    });
  }
}

module.exports = BuildingService;