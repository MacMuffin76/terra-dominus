const { createWorker, queueNames } = require('../queueConfig');
const { getLogger } = require('../../utils/logger');

function createFacilityUpgradeWorker(container) {
  const logger = getLogger({ module: 'facility-upgrade-worker' });

  return createWorker(
    queueNames.FACILITY_UPGRADE,
    async (job) => {
      const { queueId, userId } = job.data || {};

      if (!queueId) {
        job.log('Missing queueId in facility upgrade job payload');
        return;
      }

      try {
        const facilityService = container.resolve('facilityService');
        await facilityService.finalizeFacilityUpgrade(queueId, userId);
        job.log(`Facility queue ${queueId} upgrade finalized`);
      } catch (err) {
        logger.error({ err, queueId }, 'Failed to finalize facility upgrade');
        throw err;
      }
    },
    { concurrency: 2 }
  );
}

module.exports = { createFacilityUpgradeWorker };
