const { Op } = require('sequelize');
const ResearchQueue = require('../models/ResearchQueue');
const sequelize = require('../db');

class ResearchQueueRepository {
  async countPending(cityId, researchId, transaction) {
    return ResearchQueue.count({
      where: {
        cityId,
        researchId,
        status: { [Op.in]: ['queued', 'in_progress'] },
      },
      // Pas de lock ici : les agrégats (COUNT) ne supportent pas FOR UPDATE
      // et on se repose déjà sur les verrous/l'optimistic locking ailleurs
      // dans la transaction pour la cohérence.
      transaction,
    });
  }

  async getLastForCity(cityId, transaction) {
    return ResearchQueue.findOne({
      where: { cityId },
      order: [['slot', 'DESC']],
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  }

  async create(order, transaction) {
    const record = await ResearchQueue.create({
      cityId: order.cityId,
      researchId: order.researchId,
      status: order.status,
      startTime: order.startTime,
      finishTime: order.finishTime,
      slot: order.slot,
    }, { transaction });

    return record.toJSON();
  }

  async findById(id, options = {}) {
    return ResearchQueue.findByPk(id, options);
  }

  async updateStatus(order, transaction) {
    return ResearchQueue.update({
      status: order.status,
      startTime: order.startTime,
      finishTime: order.finishTime,
      slot: order.slot,
    }, {
      where: { id: order.id },
      transaction,
    });
  }

  async findQueue(cityId, options = {}) {
    return ResearchQueue.findAll({
      where: {
        cityId,
        ...(options.where || {}),
      },
      order: [['slot', 'ASC']],
      ...options,
    });
  }

  async syncQueue(cityId, transaction) {
    const queue = await ResearchQueue.findAll({
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

const transactionProvider = async (handler) => sequelize.transaction(handler);

module.exports = { ResearchQueueRepository, transactionProvider };
