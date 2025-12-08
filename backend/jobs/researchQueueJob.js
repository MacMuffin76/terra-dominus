const cron = require('node-cron');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ResearchQueueJob' });

function createResearchQueueJob(container) {
  const researchUnlockService = container.resolve('researchUnlockService');

  const job = cron.schedule('*/1 * * * *', async () => {
    try {
      await researchUnlockService.processResearchQueue();
    } catch (error) {
      logger.error({ err: error }, 'Error while processing research queue');
    }
  }, { scheduled: false });

  return job;
}

module.exports = createResearchQueueJob;