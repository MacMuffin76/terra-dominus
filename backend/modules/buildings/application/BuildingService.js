const Building = require('../domain/Building');
const ConstructionOrder = require('../domain/ConstructionOrder');
const assertOptimisticUpdate = require('../infra/assertOptimisticUpdate');

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
      const error = new Error('Pas de ville trouvée');
      error.status = 404;
      throw error;
    }
    return city;
  }

  async getBuildingDetails(buildingId) {
    const building = await this.buildingRepository.findById(buildingId);
    if (!building) {
      const error = new Error('Building not found');
      error.status = 404;
      throw error;
    }

    const entity = await this.entityRepository.findBuildingEntityByName(building.name);
    const queue = entity
      ? await this.constructionOrderRepository.findQueue(building.cityId, {
          where: { entityId: entity.entity_id, type: 'building' },
        })
      : [];

    const inProgress = queue.find((item) => item.status === 'in_progress');
    const remainingTime = inProgress && inProgress.finishTime
      ? Math.max(0, Math.ceil((new Date(inProgress.finishTime) - new Date()) / 1000))
      : 0;

    return {
      ...building,
      remainingTime,
      inProgress: !!inProgress,
      queue,
    };
  }

  async startUpgrade(userId, buildingId) {
    return this.transactionProvider(async (transaction) => {
      const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
      const building = await this.buildingRepository.findById(buildingId, { transaction, lock: transaction.LOCK.UPDATE });

      if (!building || building.cityId !== city.id) {
        const error = new Error('Building not found');
        error.status = 404;
        throw error;
      }

      const entity = await this.entityRepository.findBuildingEntityByName(building.name, { transaction });
      if (!entity) {
        const error = new Error('Entity not found for building');
        error.status = 404;
        throw error;
      }

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
        this.queueEventPublisher.emit(city.id, userId).catch(() => {});
        
        // Mettre à jour les leaderboards
        const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
        leaderboardIntegration.updateBuildingsScore(userId).catch(err => {
          console.error('Error updating buildings leaderboard:', err);
        });
        leaderboardIntegration.updateTotalPower(userId).catch(err => {
          console.error('Error updating total power leaderboard:', err);
        });
        
        // Grant Battle Pass XP
        const battlePassService = require('../../battlepass/application/BattlePassService');
        battlePassService.addXP(userId, 25).catch(err => {
          console.error('Failed to grant Battle Pass XP for building upgrade:', err);
        });
        
        // Check for achievement unlocks
        const achievementChecker = require('../../../utils/achievementChecker');
        achievementChecker.checkBuildingAchievements(userId, { level: upgraded.level })
          .catch(err => console.error('Failed to check building achievements:', err));
      });

      return new Building({ ...upgraded });
    });
  }
}

module.exports = BuildingService;