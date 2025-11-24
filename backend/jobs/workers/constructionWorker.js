const City = require('../../models/City');
const ConstructionQueue = require('../../models/ConstructionQueue');
const { createWorker, queueNames } = require('../queueConfig');

function createConstructionWorker(container) {
  return createWorker(
    queueNames.CONSTRUCTION,
    async (job) => {
      const { orderId, userId } = job.data || {};

      if (!orderId) {
        job.log('Missing orderId in construction job payload');
        return;
      }

      const order = await ConstructionQueue.findByPk(orderId);
      if (!order) {
        job.log(`Construction order ${orderId} not found`);
        return;
      }

      if (order.status === 'completed') {
        job.log(`Construction order ${orderId} already completed`);
        return;
      }

      const city = await City.findByPk(order.cityId);
      const ownerId = city?.user_id || userId;

      if (!ownerId) {
        job.log(`Unable to resolve owner for construction order ${orderId}`);
        return;
      }

      const buildingService = container.resolve('buildingService');
      await buildingService.collectConstruction(ownerId, orderId);
    },
    {
      concurrency: 2,
    }
  );
}

module.exports = { createConstructionWorker };