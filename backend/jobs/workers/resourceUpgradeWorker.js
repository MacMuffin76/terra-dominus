const { createWorker, queueNames } = require('../queueConfig');
const { getLogger } = require('../../utils/logger');

function createResourceUpgradeWorker(container) {
  const logger = getLogger({ module: 'resource-upgrade-worker' });

  return createWorker(
    queueNames.RESOURCE_UPGRADE,
    async (job) => {
      const { buildingId, userId } = job.data || {};

      if (!buildingId) {
        job.log('Missing buildingId in resource upgrade job payload');
        return;
      }

      try {
        const resourceService = container.resolve('resourceService');
        await resourceService.finalizeResourceUpgrade(buildingId, userId);
        job.log(`Resource building ${buildingId} upgrade finalized`);
      } catch (err) {
        logger.error({ err, buildingId }, 'Failed to finalize resource building upgrade');
        throw err;
      }
    },
    { concurrency: 2 }
  );
}

module.exports = { createResourceUpgradeWorker };