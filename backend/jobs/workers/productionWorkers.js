const User = require('../../models/User');
const { getQueue, createWorker, queueNames, serializeJobData } = require('../queueConfig');
const { getIO } = require('../../socket');
const { getLogger } = require('../../utils/logger');
const { trackProductionTick } = require('../../observability/metrics');

const PRODUCTION_JOB_ID = 'production-tick';
const DEFAULT_INTERVAL = Number(process.env.PRODUCTION_TICK_MS || 60000);

async function ensureProductionTick(queue) {
  const logger = getLogger({ module: 'productionWorker' });
  const existing = await queue.getRepeatableJobs();
  const existingJob = existing.find((job) => job.id === PRODUCTION_JOB_ID);

  // Si le job existe mais avec un intervalle différent, le supprimer
  if (existingJob && existingJob.every !== DEFAULT_INTERVAL) {
    logger.info({ oldInterval: existingJob.every, newInterval: DEFAULT_INTERVAL }, 'Interval changed, removing old production job');
    await queue.removeRepeatableByKey(existingJob.key);
  }

  // Créer le job s'il n'existe pas ou a été supprimé
  const stillExists = (await queue.getRepeatableJobs()).some((job) => job.id === PRODUCTION_JOB_ID);
  if (!stillExists) {
    logger.info({ interval: DEFAULT_INTERVAL }, 'Scheduling production tick');
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
    try {
      const resourceService = container.resolve('resourceService');
      const io = getIO();
      
      if (!io) {
        logger.warn('Socket.IO not available, skipping production tick');
        return;
      }

      // Récupérer uniquement les utilisateurs connectés via leurs rooms Socket.IO
      const allRooms = Array.from(io.sockets.adapter.rooms.keys());
      const connectedRooms = allRooms
        .filter(room => room.startsWith('user_'))
        .map(room => parseInt(room.replace('user_', '')))
        .filter(userId => !isNaN(userId));

      logger.debug({ 
        totalRooms: allRooms.length, 
        userRooms: connectedRooms.length,
        userIds: connectedRooms 
      }, 'Checking connected users');

      if (connectedRooms.length === 0) {
        return; // Pas d'utilisateurs connectés, rien à faire
      }

      let successCount = 0;
      let errorCount = 0;

      for (const userId of connectedRooms) {
        try {
          const resources = await resourceService.getUserResources(userId);
          io.to(`user_${userId}`).emit('resources', resources);
          logger.debug({ userId, resourceCount: resources.length }, 'Resources emitted to user');
          successCount++;
        } catch (error) {
          errorCount++;
          if (error.status !== 404) { // Ne log pas les erreurs "ville introuvable"
            logger.error({ err: error, userId }, 'Failed to process user resources');
          }
        }
      }
      
      logger.info({ successCount, errorCount }, 'Production tick completed');
    } catch (error) {
      logger.error({ err: error }, 'Production tick failed');
    }
  });
}

module.exports = { createProductionWorker };