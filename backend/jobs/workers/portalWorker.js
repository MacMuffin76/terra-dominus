/**
 * Portal Workers
 * BullMQ workers for portal spawning and expedition resolution
 */

const { createWorker } = require('../queueConfig');
const { getLogger } = require('../../utils/logger');

const logger = getLogger({ module: 'portal-workers' });

/**
 * Create the portal spawn worker
 * Runs periodically to spawn new portals
 */
const createPortalSpawnWorker = (container) => {
  const portalService = container.resolve('portalService');

  return createWorker(
    'portal',
    async (job) => {
      try {
        const { type } = job.data;

        if (type === 'spawn') {
          logger.info('Processing portal spawn job', { jobId: job.id });

          // Spawn a random portal
          const portal = await portalService.spawnRandomPortal();

          logger.info('Portal spawned successfully', {
            jobId: job.id,
            portalId: portal.id,
            tier: portal.tier,
            coords: { x: portal.coord_x, y: portal.coord_y }
          });

          return {
            success: true,
            portalId: portal.id,
            tier: portal.tier
          };
        }

        if (type === 'expire') {
          logger.info('Processing portal expiration job', { jobId: job.id });

          // Expire old portals
          const expiredCount = await portalService.expireOldPortals();

          logger.info('Expired old portals', {
            jobId: job.id,
            count: expiredCount
          });

          // Broadcast expiration to all clients (simplified, could be optimized)
          if (expiredCount > 0) {
            const { getIO } = require('../../socket');
            const io = getIO();
            io.emit('portal_expired', {
              count: expiredCount,
              timestamp: new Date()
            });
          }

          return {
            success: true,
            expiredCount
          };
        }

        throw new Error(`Unknown job type: ${type}`);
      } catch (error) {
        logger.error('Error processing portal spawn/expire job', {
          jobId: job.id,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    {
      concurrency: 1, // Process one at a time
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000 // per minute
      }
    }
  );
};

/**
 * Create the portal resolution worker
 * Resolves expeditions when they arrive
 */
const createPortalResolutionWorker = (container) => {
  const portalService = container.resolve('portalService');
  const { getIO } = require('../../socket');

  return createWorker(
    'portal',
    async (job) => {
      try {
        const { type, expeditionId } = job.data;

        if (type !== 'resolve') {
          return; // Only process 'resolve' jobs in this worker
        }

        logger.info('Processing expedition resolution', {
          jobId: job.id,
          expeditionId
        });

        // Resolve the expedition
        const result = await portalService.resolveExpedition(expeditionId);

        // Get the expedition details
        const expedition = await container.resolve('portalRepository')
          .getExpeditionById(expeditionId);

        // Send real-time notification to user
        const io = getIO();
        io.to(`user_${expedition.user_id}`).emit('portal_expedition_resolved', {
          expeditionId,
          victory: result.victory,
          survivors: result.survivors,
          loot: result.loot,
          portal: {
            id: expedition.portal.id,
            tier: expedition.portal.tier
          }
        });

        logger.info('Expedition resolved successfully', {
          jobId: job.id,
          expeditionId,
          victory: result.victory,
          attackerPower: result.attackerPower,
          defenderPower: result.defenderPower
        });

        return {
          success: true,
          expeditionId,
          victory: result.victory
        };
      } catch (error) {
        logger.error('Error processing expedition resolution', {
          jobId: job.id,
          expeditionId: job.data.expeditionId,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    {
      concurrency: 5, // Can process 5 resolutions simultaneously
      limiter: {
        max: 50,
        duration: 60000
      }
    }
  );
};

/**
 * Schedule portal spawning jobs
 * Runs every 30 minutes to spawn portals
 */
const schedulePortalSpawning = async (queue) => {
  try {
    // Add recurring job for spawning portals (every 30 minutes)
    await queue.add(
      'spawn',
      { type: 'spawn' },
      {
        repeat: {
          pattern: '*/30 * * * *' // Every 30 minutes
        },
        jobId: 'portal-spawn-recurring'
      }
    );

    // Add recurring job for expiring old portals (every 10 minutes)
    await queue.add(
      'expire',
      { type: 'expire' },
      {
        repeat: {
          pattern: '*/10 * * * *' // Every 10 minutes
        },
        jobId: 'portal-expire-recurring'
      }
    );

    logger.info('Scheduled portal spawning and expiration jobs');
  } catch (error) {
    logger.error('Error scheduling portal jobs', { error: error.message });
    throw error;
  }
};

/**
 * Schedule expedition resolution
 * Checks for arriving expeditions and schedules resolution
 */
const scheduleExpeditionResolution = async (expeditionId, arrivalTime) => {
  const { getQueue, queueNames } = require('../queueConfig');
  const queue = getQueue(queueNames.PORTAL);

  try {
    // Calculate delay
    const now = new Date();
    const delay = Math.max(0, arrivalTime.getTime() - now.getTime());

    await queue.add(
      'resolve',
      {
        type: 'resolve',
        expeditionId
      },
      {
        delay,
        jobId: `expedition-${expeditionId}`
      }
    );

    logger.info('Scheduled expedition resolution', {
      expeditionId,
      arrivalTime,
      delayMs: delay
    });
  } catch (error) {
    logger.error('Error scheduling expedition resolution', {
      expeditionId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  createPortalSpawnWorker,
  createPortalResolutionWorker,
  schedulePortalSpawning,
  scheduleExpeditionResolution
};
