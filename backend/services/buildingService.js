const { Op } = require('sequelize');
const Building = require('../models/Building');
const ResourceCost = require('../models/ResourceCost');
const Resource = require('../models/Resource');
const Entity = require('../models/Entity');
const ConstructionQueue = require('../models/ConstructionQueue');
const { getUserMainCity } = require('../utils/cityUtils');
const { getBuildDurationSeconds } = require('../utils/balancing');
const sequelize = require('../db');

const { getIO } = require('../socket');

function assertOptimisticUpdate(updatedRows) {
  if (!updatedRows) {
    const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
    error.status = 409;
    throw error;
  }
}

async function emitConstructionQueue(cityId, userId) {
  const io = getIO();
  if (!io) return;

  const queue = await ConstructionQueue.findAll({
    where: { cityId },
    order: [['slot', 'ASC']],
  });

  io.to(`user_${userId}`).emit('construction_queue:update', queue);
}

async function syncQueueForCity(cityId, transaction) {
  const queue = await ConstructionQueue.findAll({
    where: {
      cityId,
      status: {
        [Op.in]: ['queued', 'in_progress'],
      },
    },
    order: [['slot', 'ASC']],
    transaction,
    lock: transaction?.LOCK.UPDATE,
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


async function getBuildingDetails(buildingId) {
  const building = await Building.findByPk(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = 404;
    throw error;
  }

  const entity = await Entity.findOne({
    where: {
      entity_type: 'building',
      entity_name: building.name,
    },
  });

    const queueEntries = entity
    ? await ConstructionQueue.findAll({
        where: {
          cityId: building.city_id,
          entityId: entity.entity_id,
          type: 'building',
        },
        order: [['slot', 'ASC']],
      })
    : [];

  const inProgress = queueEntries.find((entry) => entry.status === 'in_progress');
  const remainingTime = inProgress && inProgress.finishTime
    ? Math.max(0, Math.ceil((new Date(inProgress.finishTime) - new Date()) / 1000))
    : 0;

  return {
    ...building.toJSON(),
    remainingTime,
    inProgress: !!inProgress,
    queue: queueEntries,
  };
}

async function upgradeBuilding(userId, buildingId) {
    return sequelize.transaction(async (transaction) => {
    const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!city) {
      const error = new Error('Pas de ville trouvée');
      error.status = 404;
      throw error;
    }

    const building = await Building.findByPk(buildingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!building || building.city_id !== city.id) {
      const error = new Error('Building not found');
      error.status = 404;
      throw error;
    }

    const entity = await Entity.findOne({
      where: {
        entity_type: 'building',
        entity_name: building.name,
      },
      transaction,
    });

    if (!entity) {
      const error = new Error('Entity not found for building');
      error.status = 404;
      throw error;
    }

    const pendingLevels = await ConstructionQueue.count({
      where: {
        cityId: city.id,
        entityId: entity.entity_id,
        type: 'building',
        status: {
          [Op.in]: ['queued', 'in_progress'],
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const nextLevel = (Number(building.level) || 0) + pendingLevels + 1;
    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entity.entity_id,
        level: nextLevel,
      },
      transaction,
    });

    for (const cost of costs) {
      const userResource = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const currentAmount = userResource ? Number(userResource.amount) || 0 : 0;

      if (currentAmount < Number(cost.amount)) {
        const error = new Error('Ressources insuffisantes pour améliorer');
        error.status = 400;
        throw error;
      }
    }

    for (const cost of costs) {
      const userResource = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const currentAmount = Number(userResource.amount);
      const updatedAmount = currentAmount - Number(cost.amount);
      const currentVersion = Number(userResource.version) || 0;

      const [affected] = await Resource.update(
        {
          amount: updatedAmount,
          version: currentVersion + 1,
        },
        {
          where: { id: userResource.id, version: currentVersion },
          transaction,
        }
      );

      assertOptimisticUpdate(affected);
      userResource.amount = updatedAmount;
      userResource.version = currentVersion + 1;
    }

    const buildDuration = getBuildDurationSeconds(nextLevel);
    const lastTask = await ConstructionQueue.findOne({
      where: { cityId: city.id },
      order: [['slot', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const startTime = lastTask?.finishTime ? new Date(lastTask.finishTime) : new Date();
    const finishTime = new Date(startTime.getTime() + buildDuration * 1000);

    const queueItem = await ConstructionQueue.create({
      cityId: city.id,
      entityId: entity.entity_id,
      type: 'building',
      status: lastTask ? 'queued' : 'in_progress',
      startTime,
      finishTime,
      slot: lastTask ? lastTask.slot + 1 : 1,
    }, { transaction });

    await syncQueueForCity(city.id, transaction);

    transaction.afterCommit(() => {
      emitConstructionQueue(city.id, userId).catch(() => {});
    });

    return queueItem.toJSON();
  });
}

async function listConstructionQueue(userId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Pas de ville trouvée');
    error.status = 404;
    throw error;
  }

  return ConstructionQueue.findAll({
    where: { cityId: city.id },
    order: [['slot', 'ASC']],
  });
}

async function cancelConstruction(userId, queueId) {
  return sequelize.transaction(async (transaction) => {
    const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!city) {
      const error = new Error('Pas de ville trouvée');
      error.status = 404;
      throw error;
    }

    const queueItem = await ConstructionQueue.findByPk(queueId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!queueItem || queueItem.cityId !== city.id) {
      const error = new Error('Construction introuvable');
      error.status = 404;
      throw error;
    }

    if (queueItem.status === 'in_progress') {
      const error = new Error('Impossible d’annuler une construction en cours');
      error.status = 400;
      throw error;
    }

    queueItem.status = 'cancelled';
    await queueItem.save({ transaction });

    await syncQueueForCity(city.id, transaction);

    transaction.afterCommit(() => {
      emitConstructionQueue(city.id, userId).catch(() => {});
    });

    return queueItem.toJSON();
  });
}

async function accelerateConstruction(userId, queueId) {
  return sequelize.transaction(async (transaction) => {
    const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!city) {
      const error = new Error('Pas de ville trouvée');
      error.status = 404;
      throw error;
    }

    const queueItem = await ConstructionQueue.findByPk(queueId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!queueItem || queueItem.cityId !== city.id) {
      const error = new Error('Construction introuvable');
      error.status = 404;
      throw error;
    }

    if (queueItem.status !== 'in_progress') {
      const error = new Error('Seule une construction en cours peut être accélérée');
      error.status = 400;
      throw error;
    }

    queueItem.finishTime = new Date();
    await queueItem.save({ transaction });

    await syncQueueForCity(city.id, transaction);

    transaction.afterCommit(() => {
      emitConstructionQueue(city.id, userId).catch(() => {});
    });

    return queueItem.toJSON();
  });
}

module.exports = {
  getBuildingDetails,
  upgradeBuilding,
  listConstructionQueue,
  cancelConstruction,
  accelerateConstruction,
};