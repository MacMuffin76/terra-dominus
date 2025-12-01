const { getLogger } = require('../utils/logger');
const User = require('../models/User');

const logger = getLogger({ module: 'ResourceProductionJob' });

/**
 * Resource Production Job
 * Updates all users' resources based on their production buildings
 * Runs every minute to keep resources up-to-date
 */
async function runResourceProductionJob() {
  const startTime = Date.now();
  logger.info('Starting resource production update for all users...');

  try {
    // Import resourceService here to avoid circular dependency
    const resourceService = require('../services/resourceService');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'username'],
    });

    logger.info({ userCount: users.length }, 'Found users to update');

    let successCount = 0;
    let errorCount = 0;

    // Update resources for each user
    for (const user of users) {
      try {
        await resourceService.getUserResources(user.id);
        successCount++;
      } catch (error) {
        errorCount++;
        logger.error(
          { err: error, userId: user.id, username: user.username },
          'Failed to update resources for user'
        );
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        duration,
        totalUsers: users.length,
        successCount,
        errorCount,
      },
      'Resource production update completed'
    );

    return {
      success: true,
      duration,
      totalUsers: users.length,
      successCount,
      errorCount,
    };
  } catch (error) {
    logger.error({ err: error }, 'Resource production job failed');
    throw error;
  }
}

/**
 * Setup the recurring job
 */
function setupResourceProductionJob() {
  const INTERVAL_MS = 60 * 1000; // 1 minute

  logger.info({ intervalMs: INTERVAL_MS }, 'Setting up resource production job');

  // Run immediately on startup
  runResourceProductionJob().catch((error) => {
    logger.error({ err: error }, 'Initial resource production job failed');
  });

  // Then run every minute
  setInterval(() => {
    runResourceProductionJob().catch((error) => {
      logger.error({ err: error }, 'Scheduled resource production job failed');
    });
  }, INTERVAL_MS);

  logger.info('Resource production job scheduled');
}

module.exports = {
  runResourceProductionJob,
  setupResourceProductionJob,
};
