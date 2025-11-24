const { Op } = require('sequelize');
const BuildingModel = require('../../../models/Building');
const ResourceModel = require('../../../models/Resource');
const ResourceCostModel = require('../../../models/ResourceCost');
const EntityModel = require('../../../models/Entity');
const ConstructionQueueModel = require('../../../models/ConstructionQueue');
const sequelize = require('../../../db');
const ResourcePool = require('../domain/ResourcePool');
const Building = require('../domain/Building');
const ConstructionOrder = require('../domain/ConstructionOrder');

class CityRepository {
  async getUserMainCity(userId, options = {}) {
    const { getUserMainCity } = require('../../../utils/cityUtils');
    return getUserMainCity(userId, options);
  }
}

class BuildingRepository {
  async findById(id, options = {}) {
    const record = await BuildingModel.findByPk(id, options);
    return record ? new Building(record.toJSON()) : null;
  }

  async findByName(cityId, name, options = {}) {
    const record = await BuildingModel.findOne({
      where: { city_id: cityId, name },
      ...options,
    });
    return record ? new Building(record.toJSON()) : null;
  }

  async save(building, transaction) {
    return BuildingModel.update(
      {
        level: building.level,
        version: building.version,
      },
      {
        where: { id: building.id, version: building.version - 1 },
        transaction,
      }
    );
  }
}

class EntityRepository {
  async findBuildingEntityByName(name, options = {}) {
    return EntityModel.findOne({
      where: {
        entity_type: 'building',
        entity_name: name,
      },
      ...options,
    });
  }

  async findById(id, options = {}) {
    return EntityModel.findOne({ where: { entity_id: id }, ...options });
  }
}

class ResourceCostRepository {
  async findByEntityAndLevel(entityId, level, options = {}) {
    return ResourceCostModel.findAll({
      where: { entity_id: entityId, level },
      ...options,
    });
  }
}

class ResourceRepository {
  async getCityPool(cityId, options = {}) {
    const resources = await ResourceModel.findAll({
      where: { city_id: cityId },
      ...options,
    });

    return new ResourcePool(resources.map((r) => r.toJSON()));
  }

  async update(resource, transaction) {
    const [affected] = await ResourceModel.update(
      {
        amount: resource.amount,
        version: resource.version,
      },
      {
        where: {
          id: resource.id,
          version: resource.version - 1,
        },
        transaction,
      },
    );

    return affected;
  }
}

class ConstructionOrderRepository {
  async countPending(cityId, entityId, transaction) {
    return ConstructionQueueModel.count({
      where: {
        cityId,
        entityId,
        type: 'building',
        status: { [Op.in]: ['queued', 'in_progress'] },
      },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  }

  async getLastForCity(cityId, transaction) {
    return ConstructionQueueModel.findOne({
      where: { cityId },
      order: [['slot', 'DESC']],
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  }

  async create(order, transaction) {
    const record = await ConstructionQueueModel.create({
      cityId: order.cityId,
      entityId: order.entityId,
      type: order.type,
      status: order.status,
      startTime: order.startTime,
      finishTime: order.finishTime,
      slot: order.slot,
    }, { transaction });

    return record.toJSON();
  }

  async findById(id, options = {}) {
    const record = await ConstructionQueueModel.findByPk(id, options);
    return record ? new ConstructionOrder(record.toJSON()) : null;
  }

  async updateStatus(order, transaction) {
    return ConstructionQueueModel.update({ status: order.status }, {
      where: { id: order.id },
      transaction,
    });
  }

  async findQueue(cityId, options = {}) {
    const records = await ConstructionQueueModel.findAll({
      where: {
        cityId,
        ...(options.where || {}),
      },
      order: [['slot', 'ASC']],
      ...options,
    });

    return records.map((record) => new ConstructionOrder(record.toJSON()));
  }

  async syncQueue(cityId, transaction) {
    const queue = await ConstructionQueueModel.findAll({
      where: {
        cityId,
        status: { [Op.in]: ['queued', 'in_progress'] },
      },
      order: [['slot', 'ASC']],
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });

    let activeStart = new Date();
    let hasActive = false;
    let slot = 1;

    for (const item of queue) {
      const durationMs = item.finishTime && item.startTime
        ? new Date(item.finishTime) - new Date(item.startTime)
        : 0;

      item.slot = slot;

      if (!hasActive) {
        item.status = 'in_progress';
        if (!item.startTime) {
          item.startTime = new Date();
          item.finishTime = new Date(item.startTime.getTime() + durationMs);
        }
        activeStart = item.finishTime ? new Date(item.finishTime) : new Date();
        hasActive = true;
      } else {
        item.status = 'queued';
        const startTime = item.startTime && item.finishTime && durationMs > 0
          ? new Date(activeStart)
          : new Date();
        item.startTime = startTime;
        item.finishTime = durationMs > 0
          ? new Date(startTime.getTime() + durationMs)
          : item.finishTime;
        activeStart = item.finishTime ? new Date(item.finishTime) : activeStart;
      }

      await item.save({ transaction });
      slot += 1;
    }
  }
}

class QueueEventPublisher {
  constructor(getIO) {
    this.getIO = getIO;
  }

  async emit(cityId, userId) {
    const io = this.getIO();
    if (!io) return;

    const queue = await ConstructionQueueModel.findAll({
      where: { cityId },
      order: [['slot', 'ASC']],
    });

    io.to(`user_${userId}`).emit('construction_queue:update', queue);
  }
}

const transactionProvider = async (handler) => sequelize.transaction(handler);

module.exports = {
  BuildingRepository,
  ResourceRepository,
  ResourceCostRepository,
  EntityRepository,
  ConstructionOrderRepository,
  QueueEventPublisher,
  CityRepository,
  transactionProvider,
};