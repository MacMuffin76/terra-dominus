const { createWorker, queueNames } = require('../queueConfig');
const { logger } = require('../../utils/logger');

/**
 * Worker pour le traitement des attaques territoriales
 */
function createAttackWorker(container) {
  const combatService = container.resolve('combatService');
  const combatRepository = container.resolve('combatRepository');

  const worker = createWorker(queueNames.ATTACK, async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'process-attack':
        return await processAttack(data.attackId, combatService, job);
      
      case 'scan-arrived-attacks':
        return await scanArrivedAttacks(combatRepository, job);
      
      default:
        logger.warn(`[AttackWorker] Type de job inconnu: ${type}`);
        return { error: 'Unknown job type' };
    }
  }, {
    concurrency: 2
  });

  // Job répétitif: scanner les attaques arrivées toutes les 30 secondes
  const attackQueue = container.resolve('attackQueue');
  attackQueue.add(
    'scan-attacks',
    { type: 'scan-arrived-attacks' },
    {
      repeat: { every: 30000 }, // 30 secondes
      jobId: 'scan-arrived-attacks'
    }
  );

  logger.info('[AttackWorker] Worker attaques démarré');
  return worker;
}

async function processAttack(attackId, combatService, job) {
  try {
    logger.info(`[AttackWorker] Traitement attaque ${attackId}`);
    job.updateProgress(50);
    
    const result = await combatService.resolveCombat(attackId);
    
    job.updateProgress(100);
    logger.info(`[AttackWorker] Attaque ${attackId} résolue`, { outcome: result.outcome });
    return result;
  } catch (error) {
    logger.error({ err: error }, `[AttackWorker] Erreur traitement attaque ${attackId}`);
    throw error;
  }
}

async function scanArrivedAttacks(combatRepository, job) {
  try {
    const arrivedAttacks = await combatRepository.getArrivedAttacks();
    logger.info(`[AttackWorker] ${arrivedAttacks.length} attaques arrivées trouvées`);

    for (const attack of arrivedAttacks) {
      // Marquer comme arrivée
      await combatRepository.updateAttackStatus(attack.id, 'arrived');

      // Ajouter job de traitement
      const Queue = require('bullmq').Queue;
      const { connection } = require('../queueConfig');
      const attackQueue = new Queue(queueNames.ATTACK, { connection });
      
      await attackQueue.add(
        'process-attack',
        { type: 'process-attack', data: { attackId: attack.id } },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    job.updateProgress(100);
    return { processed: arrivedAttacks.length };
  } catch (error) {
    logger.error({ err: error }, '[AttackWorker] Erreur scan attaques');
    throw error;
  }
}

module.exports = { createAttackWorker };
