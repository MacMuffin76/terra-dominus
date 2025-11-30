const cron = require('node-cron');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'upkeep-job' });

/**
 * Cron Job: Déduction horaire de l'upkeep des unités
 * 
 * Fréquence: Toutes les heures
 * Responsabilité:
 * - Calculer l'upkeep total de chaque ville avec des unités
 * - Déduire les ressources si disponibles
 * - Démobiliser 10% des unités si ressources insuffisantes
 * - Créer des notifications pour les joueurs impactés
 */

let job = null;

function startUpkeepJob(container) {
  if (job) {
    logger.warn('Upkeep job is already running');
    return;
  }

  // Run every hour at minute 0
  job = cron.schedule('0 * * * *', async () => {
    logger.info('⏰ Starting hourly upkeep deduction');
    
    try {
      const upkeepService = container.resolve('upkeepService');
      const notificationService = container.resolve('notificationService');
      
      const result = await upkeepService.processHourlyUpkeep();
      
      logger.info(`✅ Upkeep processing complete:`, {
        processed: result.processed,
        warnings: result.warnings.length,
        disbanded: result.disbanded.length
      });

      // Send notifications to players with warnings
      for (const warning of result.warnings) {
        try {
          await notificationService.createNotification({
            userId: warning.userId,
            type: 'upkeep_warning',
            title: 'Upkeep Payment Failed',
            message: `City "${warning.cityName}" cannot afford unit upkeep. Units are being disbanded.`,
            data: {
              cityId: warning.cityId,
              upkeepNeeded: warning.upkeepNeeded,
              shortfall: warning.shortfall
            }
          });
        } catch (err) {
          logger.error('Failed to send upkeep warning notification:', err);
        }
      }

      // Send notifications for disbanded units
      for (const disband of result.disbanded) {
        try {
          await notificationService.createNotification({
            userId: disband.userId,
            type: 'units_disbanded',
            title: 'Units Disbanded',
            message: `10% of units in "${disband.cityName}" have deserted due to lack of payment.`,
            data: {
              cityId: disband.cityId,
              unitsDisbanded: disband.unitsDisbanded
            }
          });
        } catch (err) {
          logger.error('Failed to send disbanded notification:', err);
        }
      }

    } catch (error) {
      logger.error('❌ Error in upkeep job:', error);
    }
  }, {
    timezone: 'Europe/Paris'
  });

  logger.info('✅ Upkeep cron job started (runs every hour)');
}

function stopUpkeepJob() {
  if (job) {
    job.stop();
    job = null;
    logger.info('Upkeep job stopped');
  }
}

module.exports = {
  startUpkeepJob,
  stopUpkeepJob
};
