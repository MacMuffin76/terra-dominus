/**
 * Portal Spawning Cron Job
 * Periodically spawns portals across the map
 */

const CronJob = require('cron').CronJob;
const { getLogger } = require('../utils/logger');
const logger = getLogger({ module: 'portal-cron' });

function createPortalSpawningJob(container) {
  const portalSpawnerService = container.resolve('portalSpawnerService');

  /**
   * Main portal spawning job
   * Runs every 2 hours
   */
  const spawnJob = new CronJob(
    '0 */2 * * *', // Every 2 hours
    async () => {
      try {
        logger.info('⏰ Starting scheduled portal spawn cycle...');
        
        const results = await portalSpawnerService.spawnAllTiers();
        
        logger.info(`✅ Portal spawn cycle complete. Spawned: ${results.spawned.length}, Skipped: ${results.skipped.length}`);
        
        if (results.spawned.length > 0) {
          logger.info('Spawned portals:', results.spawned);
        }
      } catch (error) {
        logger.error('❌ Portal spawn job failed:', error);
      }
    },
    null, // onComplete
    false, // start immediately
    'UTC' // timezone
  );

  /**
   * Portal expiry cleanup job
   * Runs every 30 minutes
   */
  const expiryJob = new CronJob(
    '*/30 * * * *', // Every 30 minutes
    async () => {
      try {
        const expiredCount = await portalSpawnerService.expireOldPortals();
        
        if (expiredCount > 0) {
          logger.info(`♻️  Expired ${expiredCount} old portals`);
        }
      } catch (error) {
        logger.error('❌ Portal expiry job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  /**
   * Portal database cleanup job
   * Runs daily at 3 AM UTC
   */
  const cleanupJob = new CronJob(
    '0 3 * * *', // Daily at 3 AM
    async () => {
      try {
        logger.info('🧹 Starting portal database cleanup...');
        
        const deletedCount = await portalSpawnerService.cleanupExpiredPortals(7);
        
        if (deletedCount > 0) {
          logger.info(`🗑️  Cleaned up ${deletedCount} expired portals (older than 7 days)`);
        }
      } catch (error) {
        logger.error('❌ Portal cleanup job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  return {
    spawnJob,
    expiryJob,
    cleanupJob,
    
    /**
     * Start all portal jobs
     */
    start() {
      logger.info('🚀 Starting portal cron jobs...');
      spawnJob.start();
      expiryJob.start();
      cleanupJob.start();
      logger.info('✅ Portal cron jobs started');
    },

    /**
     * Stop all portal jobs
     */
    stop() {
      logger.info('🛑 Stopping portal cron jobs...');
      spawnJob.stop();
      expiryJob.stop();
      cleanupJob.stop();
      logger.info('✅ Portal cron jobs stopped');
    },
  };
}

module.exports = createPortalSpawningJob;
