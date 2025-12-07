/**
 * Script de test pour vérifier la synchronisation des constructions
 * Simule un redémarrage du serveur avec des constructions en cours
 */

const db = require('./db');
const ConstructionQueue = require('./models/ConstructionQueue');
const { syncConstructionJobs } = require('./jobs/syncConstructionJobs');
const { getQueue, queueNames } = require('./jobs/queueConfig');

async function testConstructionSync() {
  console.log('🧪 Test de synchronisation des constructions\n');

  // 1. Vérifier l'état actuel des constructions
  console.log('📊 État actuel des constructions:');
  const allConstructions = await ConstructionQueue.findAll({
    where: {
      status: 'in_progress'
    },
    order: [['id', 'DESC']],
    limit: 5
  });

  if (allConstructions.length === 0) {
    console.log('  ✅ Aucune construction in_progress\n');
  } else {
    console.log(`  ⚠️ ${allConstructions.length} construction(s) in_progress:\n`);
    for (const c of allConstructions) {
      const now = new Date();
      const finish = new Date(c.finishTime);
      const isExpired = finish <= now;
      const remainingMs = finish - now;
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      console.log(`    - ID: ${c.id}, City: ${c.cityId}, Entity: ${c.entityId}`);
      console.log(`      Finish: ${c.finishTime}`);
      console.log(`      Status: ${isExpired ? '❌ EXPIRED' : `⏳ ${remainingSec}s remaining`}\n`);
    }
  }

  // 2. Vérifier l'état de la queue BullMQ
  console.log('🔍 État de la queue BullMQ:');
  const constructionQueue = getQueue(queueNames.CONSTRUCTION);
  const jobs = await constructionQueue.getJobs(['waiting', 'delayed', 'active']);
  console.log(`  ${jobs.length} job(s) dans la queue\n`);

  // 3. Exécuter la synchronisation
  console.log('⚙️ Exécution de la synchronisation...');
  const result = await syncConstructionJobs();
  console.log(`  ✅ Résultat: ${result.synced} synchronisé(s), ${result.expired} expiré(s)\n`);

  // 4. Vérifier l'état après synchronisation
  console.log('📊 État après synchronisation:');
  const afterConstructions = await ConstructionQueue.findAll({
    where: {
      status: 'in_progress'
    }
  });
  console.log(`  ${afterConstructions.length} construction(s) in_progress restante(s)\n`);

  const afterJobs = await constructionQueue.getJobs(['waiting', 'delayed', 'active']);
  console.log(`  ${afterJobs.length} job(s) dans la queue BullMQ\n`);

  if (afterJobs.length > 0) {
    console.log('📋 Détails des jobs:');
    for (const job of afterJobs) {
      const state = await job.getState();
      console.log(`  - Job ${job.id}: ${state}`);
      console.log(`    Data:`, job.data);
      if (job.opts.delay) {
        console.log(`    Delay: ${Math.round(job.opts.delay / 1000)}s`);
      }
    }
  }

  console.log('\n✅ Test terminé');
  process.exit(0);
}

testConstructionSync().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
