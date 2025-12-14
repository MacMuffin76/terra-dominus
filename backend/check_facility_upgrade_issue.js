require('dotenv').config();
const sequelize = require('./db');
const { Queue } = require('bullmq');
const { connection, queueNames } = require('./jobs/queueConfig');

async function checkFacilityUpgradeIssue() {
  try {
    console.log('\n🔍 Diagnostic du problème de mise à niveau des installations...\n');

    // 1. Vérifier les constructions en cours
    const [constructions] = await sequelize.query(`
      SELECT 
        cq.id,
        cq.city_id,
        cq.entity_id,
        cq.type,
        cq.status,
        cq.start_time,
        cq.finish_time,
        e.entity_name,
        EXTRACT(EPOCH FROM (cq.finish_time - NOW())) as seconds_remaining
      FROM construction_queue cq
      LEFT JOIN entities e ON e.entity_id = cq.entity_id
      WHERE cq.type = 'facility' 
      ORDER BY cq.city_id, cq.finish_time;
    `);

    console.log('=== Constructions de type facility ===');
    if (constructions.length === 0) {
      console.log('❌ Aucune construction de type facility trouvée\n');
    } else {
      constructions.forEach(c => {
        const isExpired = c.seconds_remaining <= 0;
        const timeInfo = isExpired 
          ? `⏰ Expiré depuis ${Math.abs(Math.round(c.seconds_remaining))}s`
          : `⏳ Reste ${Math.round(c.seconds_remaining)}s`;
        
        console.log(`\nQueue ID: ${c.id}`);
        console.log(`  Installation: ${c.entity_name}`);
        console.log(`  Statut: ${c.status} ${isExpired && c.status === 'in_progress' ? '⚠️ PROBLÈME!' : '✅'}`);
        console.log(`  ${timeInfo}`);
        console.log(`  Fin prévue: ${new Date(c.finish_time).toLocaleString()}`);
      });
      console.log('');
    }

    // 2. Vérifier les jobs dans la queue Redis
    const facilityQueue = new Queue(queueNames.FACILITY_UPGRADE, { connection });
    
    console.log('\n=== Jobs dans la queue facility-upgrade (Redis) ===');
    
    const waitingJobs = await facilityQueue.getWaiting();
    const activeJobs = await facilityQueue.getActive();
    const delayedJobs = await facilityQueue.getDelayed();
    const completedJobs = await facilityQueue.getCompleted();
    const failedJobs = await facilityQueue.getFailed();

    console.log(`En attente: ${waitingJobs.length}`);
    console.log(`Actifs: ${activeJobs.length}`);
    console.log(`Différés: ${delayedJobs.length}`);
    console.log(`Complétés: ${completedJobs.length}`);
    console.log(`Échoués: ${failedJobs.length}`);

    if (delayedJobs.length > 0) {
      console.log('\n📋 Jobs différés:');
      for (const job of delayedJobs) {
        const delay = job.timestamp + job.delay - Date.now();
        const isExpired = delay <= 0;
        console.log(`\n  Job ID: ${job.id}`);
        console.log(`    Data:`, job.data);
        console.log(`    Delay: ${Math.round(delay/1000)}s ${isExpired ? '⚠️ DEVRAIT ÊTRE EXÉCUTÉ!' : ''}`);
        console.log(`    Créé: ${new Date(job.timestamp).toLocaleString()}`);
      }
    }

    if (failedJobs.length > 0) {
      console.log('\n❌ Jobs échoués:');
      for (const job of failedJobs) {
        console.log(`\n  Job ID: ${job.id}`);
        console.log(`    Data:`, job.data);
        console.log(`    Erreur:`, job.failedReason);
        console.log(`    Stack:`, job.stacktrace?.[0]);
      }
    }

    // 3. Vérifier si le worker facility-upgrade tourne
    console.log('\n=== Vérification des workers ===');
    const workers = await facilityQueue.getWorkers();
    console.log(`Workers actifs pour facility-upgrade: ${workers.length}`);
    if (workers.length === 0) {
      console.log('⚠️  PROBLÈME: Aucun worker n\'est en train de traiter la queue facility-upgrade!');
      console.log('   → Vérifiez que le serveur ou startWorkers.js est démarré');
    }

    // 4. Proposer une correction
    const expiredInProgress = constructions.filter(c => 
      c.seconds_remaining <= 0 && c.status === 'in_progress'
    );

    if (expiredInProgress.length > 0) {
      console.log('\n\n💡 CORRECTION SUGGÉRÉE:');
      console.log(`   ${expiredInProgress.length} construction(s) bloquée(s) en "in_progress" alors que le timer est écoulé.`);
      console.log('\n   Pour les débloquer manuellement, exécutez:');
      console.log('   node backend/fix_stuck_facility_upgrades.js');
    }

    await facilityQueue.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

checkFacilityUpgradeIssue();
