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
    // Trouver les attaques qui sont arrivées à destination
    const arrivedAttacks = await combatRepository.getArrivedAttacks();
    logger.info(`[AttackWorker] ${arrivedAttacks.length} attaques arrivées trouvées`);

    const Queue = require('bullmq').Queue;
    const { connection } = require('../queueConfig');
    const attackQueue = new Queue(queueNames.ATTACK, { connection });

    for (const attack of arrivedAttacks) {
      // Marquer comme arrivée
      await combatRepository.updateAttackStatus(attack.id, 'arrived');

      // Ajouter job de traitement immédiat
      await attackQueue.add(
        'process-attack',
        { type: 'process-attack', data: { attackId: attack.id } },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
      
      logger.info(`[AttackWorker] Attaque ${attack.id} programmée pour traitement`);
    }

    // IMPORTANT : Aussi traiter les attaques déjà en status 'arrived' (cas de relance après crash)
    const stuckAttacks = await combatRepository.getAttacksByStatus('arrived');
    logger.info(`[AttackWorker] ${stuckAttacks.length} attaques bloquées en 'arrived' trouvées`);

    for (const attack of stuckAttacks) {
      // Ajouter job de traitement si pas déjà en cours
      await attackQueue.add(
        'process-attack',
        { type: 'process-attack', data: { attackId: attack.id } },
        { 
          attempts: 3, 
          backoff: { type: 'exponential', delay: 5000 },
          jobId: `attack-${attack.id}` // Évite les doublons
        }
      );
      
      logger.info(`[AttackWorker] Attaque bloquée ${attack.id} programmée pour traitement`);
    }

    job.updateProgress(100);
    return { 
      newlyArrived: arrivedAttacks.length,
      stuckProcessed: stuckAttacks.length 
    };
  } catch (error) {
    logger.error({ err: error }, '[AttackWorker] Erreur scan attaques');
    throw error;
  }
}

module.exports = { createAttackWorker };
