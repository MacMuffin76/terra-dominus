const User = require('../../models/User');
const { getQueue, createWorker, queueNames, serializeJobData } = require('../queueConfig');
const { getIO } = require('../../socket');
const { getLogger } = require('../../utils/logger');

const PRODUCTION_JOB_ID = 'production-tick';
const DEFAULT_INTERVAL = Number(process.env.PRODUCTION_TICK_MS || 60000);

async function ensureProductionTick(queue) {
  const existing = await queue.getRepeatableJobs();
  const alreadyScheduled = existing.some((job) => job.id === PRODUCTION_JOB_ID);

  if (!alreadyScheduled) {
    await queue.add('production-tick', serializeJobData({}), {
      jobId: PRODUCTION_JOB_ID,
      repeat: { every: DEFAULT_INTERVAL },
    });
  }
}

function createProductionWorker(container) {
  const logger = getLogger({ module: 'productionWorker' });
  const queue = getQueue(queueNames.PRODUCTION);
  ensureProductionTick(queue).catch((err) => {
    logger.error({ err }, 'Failed to schedule production tick');
  });

  return createWorker(queueNames.PRODUCTION, async () => {
    const resourceService = container.resolve('resourceService');
    const io = getIO();
    const users = await User.findAll({ attributes: ['id'] });

    for (const user of users) {
      const resources = await resourceService.getUserResources(user.id);
      if (io) {
        io.to(`user_${user.id}`).emit('resources', resources);
      }
    }
  });
}

module.exports = { createProductionWorker };