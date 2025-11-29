const { createWorker, queueNames } = require('../queueConfig');
const { logger } = require('../../utils/logger');

/**
 * Worker pour traiter les missions de colonisation
 * Vérifie périodiquement les missions arrivées et finalise la création des villes
 */
function createColonizationWorker(container) {
  const colonizationService = container.resolve('colonizationService');
  const colonizationRepository = container.resolve('colonizationRepository');

  const worker = createWorker(queueNames.COLONIZATION, async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'finalize-colonization':
        return await finalizeMission(data.missionId, colonizationService, job);
      
      case 'scan-arrived-missions':
        return await scanArrivedMissions(colonizationRepository, job);
      
      default:
        logger.warn(`[ColonizationWorker] Type de job inconnu: ${type}`);
        return { error: 'Unknown job type' };
    }
  }, {
    concurrency: 2
  });

  // Job répétitif: scanner les missions arrivées toutes les 30 secondes
  const colonizationQueue = container.resolve('colonizationQueue');
  colonizationQueue.add(
    'scan-missions',
    { type: 'scan-arrived-missions' },
    {
      repeat: { every: 30000 }, // 30 secondes
      jobId: 'scan-arrived-missions'
    }
  );

  logger.info('[ColonizationWorker] Worker colonisation démarré');
  return worker;
}

/**
 * Finaliser une mission de colonisation arrivée
 */
async function finalizeMission(missionId, colonizationService, job) {
  try {
    logger.info({ missionId }, '[ColonizationWorker] Finalisation mission colonisation');

    const result = await colonizationService.finalizeMission(missionId);

    if (result) {
      logger.info(
        { missionId, cityId: result.cityId },
        '[ColonizationWorker] Mission finalisée avec succès'
      );
      return result;
    } else {
      logger.warn({ missionId }, '[ColonizationWorker] Mission non finalisée (pas prête ou invalide)');
      return null;
    }
  } catch (error) {
    logger.error({ err: error, missionId }, '[ColonizationWorker] Erreur finalisation mission');
    throw error;
  }
}

/**
 * Scanner les missions arrivées et enqueue leur finalisation
 */
async function scanArrivedMissions(colonizationRepository, job) {
  try {
    logger.debug('[ColonizationWorker] Scan missions arrivées');

    const arrivedMissions = await colonizationRepository.getArrivedMissions();

    if (arrivedMissions.length === 0) {
      logger.debug('[ColonizationWorker] Aucune mission arrivée');
      return { processed: 0 };
    }

    logger.info({ count: arrivedMissions.length }, '[ColonizationWorker] Missions arrivées trouvées');

    // Enqueue finalization jobs via le container
    const colonizationQueue = job.queueOptions?.queue;
    if (colonizationQueue) {
      const promises = arrivedMissions.map((mission) =>
        colonizationQueue.add(
          'finalize-mission',
          { type: 'finalize-colonization', data: { missionId: mission.id } },
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
        )
      );

      await Promise.all(promises);
    }

    return { processed: arrivedMissions.length };
  } catch (error) {
    logger.error({ err: error }, '[ColonizationWorker] Erreur scan missions');
    throw error;
  }
}

module.exports = { createColonizationWorker };
