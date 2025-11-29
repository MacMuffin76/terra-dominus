const { createWorker, queueNames } = require('../queueConfig');
const { logger } = require('../../utils/logger');

/**
 * Worker pour le traitement des convois commerciaux
 */
function createTradeWorker(container) {
  const tradeService = container.resolve('tradeService');
  const tradeRepository = container.resolve('tradeRepository');

  const worker = createWorker(queueNames.TRADE, async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'finalize-convoy':
        return await finalizeConvoy(data.convoyId, tradeService, job);
      
      case 'scan-arrived-convoys':
        return await scanArrivedConvoys(tradeRepository, job);
      
      case 'process-auto-transfers':
        return await processAutoTransfers(tradeService, job);
      
      default:
        logger.warn(`[TradeWorker] Type de job inconnu: ${type}`);
        return { error: 'Unknown job type' };
    }
  }, {
    concurrency: 2
  });

  // Job répétitif: scanner les convois arrivés toutes les 30 secondes
  const tradeQueue = container.resolve('tradeQueue');
  tradeQueue.add(
    'scan-convoys',
    { type: 'scan-arrived-convoys' },
    {
      repeat: { every: 30000 },
      jobId: 'scan-arrived-convoys'
    }
  );

  // Job répétitif: transferts automatiques toutes les 5 minutes
  tradeQueue.add(
    'auto-transfers',
    { type: 'process-auto-transfers' },
    {
      repeat: { every: 300000 }, // 5 minutes
      jobId: 'process-auto-transfers'
    }
  );

  logger.info('[TradeWorker] Worker commerce démarré');
  return worker;
}

async function finalizeConvoy(convoyId, tradeService, job) {
  try {
    logger.info(`[TradeWorker] Finalisation convoi ${convoyId}`);
    job.updateProgress(50);
    
    const result = await tradeService.finalizeConvoyArrival(convoyId);
    
    job.updateProgress(100);
    logger.info(`[TradeWorker] Convoi ${convoyId} finalisé`);
    return result;
  } catch (error) {
    logger.error(`[TradeWorker] Erreur finalisation convoi ${convoyId}`, { error: error.message });
    throw error;
  }
}

async function scanArrivedConvoys(tradeRepository, job) {
  try {
    const arrivedConvoys = await tradeRepository.getArrivedConvoys();
    logger.info(`[TradeWorker] ${arrivedConvoys.length} convois arrivés trouvés`);

    for (const convoy of arrivedConvoys) {
      const Queue = require('bullmq').Queue;
      const { connection } = require('../queueConfig');
      const tradeQueue = new Queue(queueNames.TRADE, { connection });
      
      await tradeQueue.add(
        'finalize-convoy',
        { type: 'finalize-convoy', data: { convoyId: convoy.id } },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    job.updateProgress(100);
    return { processed: arrivedConvoys.length };
  } catch (error) {
    logger.error('[TradeWorker] Erreur scan convois', { error: error.message });
    throw error;
  }
}

async function processAutoTransfers(tradeService, job) {
  try {
    logger.info('[TradeWorker] Traitement transferts automatiques');
    job.updateProgress(50);
    
    const results = await tradeService.processAutoTransfers();
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`[TradeWorker] ${successCount}/${results.length} transferts auto réussis`);
    
    job.updateProgress(100);
    return results;
  } catch (error) {
    logger.error('[TradeWorker] Erreur transferts auto', { error: error.message });
    throw error;
  }
}

module.exports = { createTradeWorker };
