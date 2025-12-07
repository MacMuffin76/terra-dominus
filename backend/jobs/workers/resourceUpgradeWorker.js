const { createWorker, queueNames } = require('../queueConfig');
const { getLogger } = require('../../utils/logger');

function createResourceUpgradeWorker(container) {
  const logger = getLogger({ module: 'resource-upgrade-worker' });

  return createWorker(
    queueNames.RESOURCE_UPGRADE,
    async (job) => {
      const { queueId, buildingId, userId } = job.data || {};

      // Support ancien format avec buildingId et nouveau format avec queueId
      const id = queueId || buildingId;

      if (!id) {
        job.log('Missing queueId/buildingId in resource upgrade job payload');
        return;
      }

      try {
        const resourceService = container.resolve('resourceService');
        await resourceService.finalizeResourceUpgrade(id, userId);
        job.log(`Resource building ${id} upgrade finalized`);
      } catch (err) {
        logger.error({ err, queueId: id }, 'Failed to finalize resource building upgrade');
        throw err;
      }
    },
    { concurrency: 2 }
  );
}

module.exports = { createResourceUpgradeWorker };