/**
 * Quest Rotation Cron Job
 * Handles daily and weekly quest rotation, expiry cleanup
 */

const CronJob = require('cron').CronJob;
const { getLogger } = require('../utils/logger');
const logger = getLogger({ module: 'quest-cron' });

function createQuestRotationJob(container) {
  const portalQuestService = container.resolve('portalQuestService');

  /**
   * Daily quest rotation job
   * Runs daily at midnight UTC
   * - Rotates daily quests for all users
   * - Marks expired daily quests as failed
   * - Updates streak tracking
   */
  const dailyRotationJob = new CronJob(
    '0 0 * * *', // Daily at midnight UTC
    async () => {
      try {
        logger.info('⏰ Starting daily quest rotation...');
        
        const result = await portalQuestService.rotateDailyQuests();
        
        logger.info(`✅ Daily quest rotation complete. Rotated for ${result.usersRotated || 0} users`);
        
        if (result.errors && result.errors.length > 0) {
          logger.warn(`⚠️  ${result.errors.length} users had rotation errors`);
        }
      } catch (error) {
        logger.error('❌ Daily quest rotation job failed:', error);
      }
    },
    null, // onComplete
    false, // start immediately
    'UTC' // timezone
  );

  /**
   * Weekly quest rotation job
   * Runs every Monday at midnight UTC
   * - Rotates weekly quests for all users
   * - Marks expired weekly quests as failed
   */
  const weeklyRotationJob = new CronJob(
    '0 0 * * 1', // Every Monday at midnight UTC
    async () => {
      try {
        logger.info('⏰ Starting weekly quest rotation...');
        
        const result = await portalQuestService.rotateWeeklyQuests();
        
        logger.info(`✅ Weekly quest rotation complete. Rotated for ${result.usersRotated || 0} users`);
        
        if (result.errors && result.errors.length > 0) {
          logger.warn(`⚠️  ${result.errors.length} users had rotation errors`);
        }
      } catch (error) {
        logger.error('❌ Weekly quest rotation job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  /**
   * Expired quest cleanup job
   * Runs every hour
   * - Marks overdue daily quests as failed
   * - Marks overdue weekly quests as failed
   * - Cleans up quest progress for inactive users
   */
  const expiryCleanupJob = new CronJob(
    '0 * * * *', // Every hour
    async () => {
      try {
        const result = await portalQuestService.cleanupExpiredQuests();
        
        if (result.expired > 0) {
          logger.info(`♻️  Marked ${result.expired} expired quests as failed`);
        }
        
        if (result.cleaned > 0) {
          logger.info(`🗑️  Cleaned up ${result.cleaned} stale quest progress entries`);
        }
      } catch (error) {
        logger.error('❌ Quest expiry cleanup job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  /**
   * Streak reset check job
   * Runs every 6 hours
   * - Checks for users who missed daily completions
   * - Resets streaks for users who broke their streak
   */
  const streakCheckJob = new CronJob(
    '0 */6 * * *', // Every 6 hours
    async () => {
      try {
        const result = await portalQuestService.checkAndResetStreaks();
        
        if (result.reset > 0) {
          logger.info(`📊 Reset ${result.reset} user streaks due to missed daily completions`);
        }
      } catch (error) {
        logger.error('❌ Streak check job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  /**
   * Quest database cleanup job
   * Runs daily at 4 AM UTC
   * - Cleans up old completed quests (story quests are kept)
   * - Archives old quest progress (30+ days)
   */
  const databaseCleanupJob = new CronJob(
    '0 4 * * *', // Daily at 4 AM UTC
    async () => {
      try {
        logger.info('🧹 Starting quest database cleanup...');
        
        const result = await portalQuestService.archiveOldQuestProgress(30); // 30 days
        
        if (result.archived > 0) {
          logger.info(`📦 Archived ${result.archived} old quest progress entries (30+ days old)`);
        }
        
        logger.info('✅ Quest database cleanup complete');
      } catch (error) {
        logger.error('❌ Quest database cleanup job failed:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  return {
    dailyRotationJob,
    weeklyRotationJob,
    expiryCleanupJob,
    streakCheckJob,
    databaseCleanupJob,
    
    /**
     * Start all quest rotation jobs
     */
    start() {
      logger.info('🚀 Starting quest rotation cron jobs...');
      dailyRotationJob.start();
      weeklyRotationJob.start();
      expiryCleanupJob.start();
      streakCheckJob.start();
      databaseCleanupJob.start();
      logger.info('✅ Quest rotation cron jobs started');
      logger.info('📅 Schedule:');
      logger.info('   - Daily rotation: Every day at 00:00 UTC');
      logger.info('   - Weekly rotation: Every Monday at 00:00 UTC');
      logger.info('   - Expiry cleanup: Every hour');
      logger.info('   - Streak check: Every 6 hours');
      logger.info('   - Database cleanup: Daily at 04:00 UTC');
    },

    /**
     * Stop all quest rotation jobs
     */
    stop() {
      logger.info('🛑 Stopping quest rotation cron jobs...');
      dailyRotationJob.stop();
      weeklyRotationJob.stop();
      expiryCleanupJob.stop();
      streakCheckJob.stop();
      databaseCleanupJob.stop();
      logger.info('✅ Quest rotation cron jobs stopped');
    },
  };
}

module.exports = createQuestRotationJob;
