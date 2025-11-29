const { createWorker, queueNames } = require('../queueConfig');
const { logger } = require('../../utils/logger');

/**
 * Worker pour le traitement des missions d'espionnage
 */
function createSpyWorker(container) {
  const combatService = container.resolve('combatService');
  const combatRepository = container.resolve('combatRepository');

  const worker = createWorker(queueNames.SPY, async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'process-spy-mission':
        return await processSpyMission(data.missionId, combatService, job);
      
      case 'scan-arrived-spy-missions':
        return await scanArrivedSpyMissions(combatRepository, job);
      
      default:
        logger.warn(`[SpyWorker] Type de job inconnu: ${type}`);
        return { error: 'Unknown job type' };
    }
  }, {
    concurrency: 2
  });

  // Job répétitif: scanner les missions arrivées toutes les 30 secondes
  const spyQueue = container.resolve('spyQueue');
  spyQueue.add(
    'scan-spy-missions',
    { type: 'scan-arrived-spy-missions' },
    {
      repeat: { every: 30000 },
      jobId: 'scan-arrived-spy-missions'
    }
  );

  logger.info('[SpyWorker] Worker espionnage démarré');
  return worker;
}

async function processSpyMission(missionId, combatService, job) {
  try {
    logger.info(`[SpyWorker] Traitement mission espionnage ${missionId}`);
    job.updateProgress(50);
    
    const result = await combatService.resolveSpyMission(missionId);
    
    job.updateProgress(100);
    logger.info(`[SpyWorker] Mission ${missionId} résolue`, { success: result.success });
    return result;
  } catch (error) {
    logger.error({ err: error }, `[SpyWorker] Erreur traitement mission ${missionId}`);
    throw error;
  }
}

async function scanArrivedSpyMissions(combatRepository, job) {
  try {
    const arrivedMissions = await combatRepository.getArrivedSpyMissions();
    logger.info(`[SpyWorker] ${arrivedMissions.length} missions espionnage arrivées trouvées`);

    for (const mission of arrivedMissions) {
      const Queue = require('bullmq').Queue;
      const { connection } = require('../queueConfig');
      const spyQueue = new Queue(queueNames.SPY, { connection });
      
      await spyQueue.add(
        'process-spy-mission',
        { type: 'process-spy-mission', data: { missionId: mission.id } },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    job.updateProgress(100);
    return { processed: arrivedMissions.length };
  } catch (error) {
    logger.error({ err: error }, '[SpyWorker] Erreur scan missions espionnage');
    throw error;
  }
}

module.exports = { createSpyWorker };
