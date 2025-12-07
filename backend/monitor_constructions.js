/**
 * Script de monitoring des constructions
 * Affiche l'état actuel de toutes les constructions et des jobs BullMQ
 */

const db = require('./db');
const ConstructionQueue = require('./models/ConstructionQueue');
const { getQueue, queueNames } = require('./jobs/queueConfig');

async function monitorConstructions() {
  console.log('🏗️  Construction Monitoring Dashboard\n');
  console.log('═'.repeat(60));

  const now = new Date();

  // 1. Constructions par statut
  const statusCounts = await ConstructionQueue.count({
    group: ['status']
  });

  console.log('\n📊 Constructions par statut:');
  if (statusCounts.length === 0) {
    console.log('  Aucune construction trouvée');
  } else {
    for (const { status, count } of statusCounts) {
      console.log(`  ${status}: ${count}`);
    }
  }

  // 2. Constructions in_progress
  const inProgress = await ConstructionQueue.findAll({
    where: { status: 'in_progress' },
    order: [['finishTime', 'ASC']]
  });

  if (inProgress.length > 0) {
    console.log('\n🔨 Constructions en cours:');
    for (const c of inProgress) {
      const finish = new Date(c.finishTime);
      const isExpired = finish <= now;
      const remainingMs = finish - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      const remainingMin = Math.floor(remainingSec / 60);
      const remainingHours = Math.floor(remainingMin / 60);

      let timeStr;
      if (isExpired) {
        const delayMs = now - finish;
        const delayMin = Math.floor(delayMs / (1000 * 60));
        timeStr = `❌ EXPIRED (${delayMin}min ago)`;
      } else if (remainingHours > 0) {
        timeStr = `⏳ ${remainingHours}h ${remainingMin % 60}min`;
      } else if (remainingMin > 0) {
        timeStr = `⏳ ${remainingMin}min ${remainingSec % 60}s`;
      } else {
        timeStr = `⏳ ${remainingSec}s`;
      }

      console.log(`\n  ID: ${c.id}`);
      console.log(`    City: ${c.cityId}, Entity: ${c.entityId}, Type: ${c.type}`);
      console.log(`    Started: ${c.startTime}`);
      console.log(`    Finish: ${c.finishTime}`);
      console.log(`    ${timeStr}`);
    }
  }

  // 3. Constructions queued
  const queued = await ConstructionQueue.findAll({
    where: { status: 'queued' },
    order: [['cityId', 'ASC'], ['slot', 'ASC']],
    limit: 10
  });

  if (queued.length > 0) {
    console.log('\n📋 Constructions en attente (max 10):');
    for (const c of queued) {
      console.log(`  ID: ${c.id}, City: ${c.cityId}, Slot: ${c.slot}, Entity: ${c.entityId}`);
    }
  }

  // 4. Jobs BullMQ
  console.log('\n🔧 BullMQ Jobs:');
  
  const constructionQueue = getQueue(queueNames.CONSTRUCTION);
  const resourceQueue = getQueue(queueNames.RESOURCE_UPGRADE);
  const facilityQueue = getQueue(queueNames.FACILITY_UPGRADE);

  const constructionJobs = await constructionQueue.getJobs(['waiting', 'delayed', 'active', 'failed']);
  const resourceJobs = await resourceQueue.getJobs(['waiting', 'delayed', 'active', 'failed']);
  const facilityJobs = await facilityQueue.getJobs(['waiting', 'delayed', 'active', 'failed']);

  console.log(`  Construction queue: ${constructionJobs.length} jobs`);
  console.log(`  Resource upgrade queue: ${resourceJobs.length} jobs`);
  console.log(`  Facility upgrade queue: ${facilityJobs.length} jobs`);

  if (constructionJobs.length > 0 || resourceJobs.length > 0 || facilityJobs.length > 0) {
    console.log('\n  Détails des jobs:');
    
    for (const job of [...constructionJobs, ...resourceJobs, ...facilityJobs]) {
      const state = await job.getState();
      const queueName = job.queueName;
      console.log(`\n    [${queueName}] Job ${job.id}: ${state}`);
      console.log(`      Data:`, job.data);
      
      if (job.opts.delay) {
        const delaySeconds = Math.round(job.opts.delay / 1000);
        console.log(`      Delay: ${delaySeconds}s`);
      }
      
      if (job.failedReason) {
        console.log(`      Failed: ${job.failedReason}`);
      }
    }
  }

  // 5. Recommandations
  const expiredCount = inProgress.filter(c => new Date(c.finishTime) <= now).length;
  
  if (expiredCount > 0) {
    console.log('\n⚠️  ATTENTION:');
    console.log(`   ${expiredCount} construction(s) expirée(s) détectée(s)`);
    console.log('   Exécutez: node fix_stuck_constructions.js');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Monitoring terminé\n');
  
  process.exit(0);
}

monitorConstructions().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
