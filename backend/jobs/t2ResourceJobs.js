const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'T2ResourceJobs' });

/**
 * Process completed T2 resource conversions
 * Run this every 5 minutes via cron
 */
async function processCompletedConversions(container) {
  try {
    const resourceT2Service = container.resolve('resourceT2Service');
    
    const processed = await resourceT2Service.processCompletedConversions();
    
    if (processed > 0) {
      logger.info({ processed }, 'Processed T2 conversions');
    }
    
    return processed;
  } catch (error) {
    logger.error({ error }, 'Failed to process T2 conversions');
    throw error;
  }
}

/**
 * Award passive T2 production to all active users
 * Run this every hour via cron
 */
async function awardPassiveProduction(container) {
  try {
    // TODO: Implement when building system is integrated
    logger.info('Passive T2 production job (not yet implemented)');
    return 0;
  } catch (error) {
    logger.error({ error }, 'Failed to award passive T2 production');
    throw error;
  }
}

module.exports = {
  processCompletedConversions,
  awardPassiveProduction,
};
