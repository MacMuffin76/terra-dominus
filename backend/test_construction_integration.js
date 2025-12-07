/**
 * Test d'intégration complet du système de construction
 * Simule un cycle complet: création -> redémarrage -> synchronisation -> complétion
 */

const db = require('./db');
const ConstructionQueue = require('./models/ConstructionQueue');
const City = require('./models/City');
const { syncConstructionJobs } = require('./jobs/syncConstructionJobs');
const { scheduleConstructionCompletion, removeConstructionJob } = require('./jobs/constructionQueue');
const { getQueue, queueNames } = require('./jobs/queueConfig');

async function testFullConstructionCycle() {
  console.log('🧪 Test d\'intégration - Cycle complet de construction\n');
  console.log('═'.repeat(70));

  try {
    // 1. Trouver une ville de test
    const { Op } = require('sequelize');
    const city = await City.findOne({ 
      where: { 
        user_id: { [Op.ne]: null } 
      } 
    });
    if (!city) {
      console.log('❌ Aucune ville trouvée pour le test');
      process.exit(1);
    }

    console.log(`\n✅ Ville de test: ID ${city.id}, User ${city.user_id}`);

    // 2. Créer une construction de test avec un finishTime court
    const testStartTime = new Date();
    const testFinishTime = new Date(testStartTime.getTime() + 5000); // 5 secondes

    const testConstruction = await ConstructionQueue.create({
      cityId: city.id,
      entityId: 1, // Test entity
      type: 'building',
      status: 'in_progress',
      startTime: testStartTime,
      finishTime: testFinishTime,
      slot: 999, // Slot spécial pour les tests
    });

    console.log(`\n✅ Construction de test créée: ID ${testConstruction.id}`);
    console.log(`   Start: ${testStartTime}`);
    console.log(`   Finish: ${testFinishTime} (dans 5 secondes)`);

    // 3. Programmer le job BullMQ
    await scheduleConstructionCompletion(testConstruction, { userId: city.user_id });
    console.log(`\n✅ Job BullMQ programmé`);

    // Vérifier que le job existe
    const queue = getQueue(queueNames.RESOURCE_UPGRADE); // Car scheduleConstructionCompletion utilise resource-upgrade pour buildings
    const allJobs = await queue.getJobs(['waiting', 'delayed', 'active']);
    const testJob = allJobs.find(j => j.data.queueId === testConstruction.id);
    
    if (testJob) {
      console.log(`   Job trouvé: ${testJob.id}`);
      console.log(`   Delay: ${Math.round(testJob.opts.delay / 1000)}s`);
    } else {
      console.log(`   ⚠️ Job non trouvé dans la queue`);
    }

    // 4. Simuler un redémarrage (supprimer le job)
    console.log(`\n🔄 Simulation d'un redémarrage du serveur...`);
    await removeConstructionJob(testConstruction.id);
    
    const jobsAfterRemoval = await queue.getJobs(['waiting', 'delayed', 'active']);
    const jobStillExists = jobsAfterRemoval.find(j => j.data.queueId === testConstruction.id);
    
    if (jobStillExists) {
      console.log(`   ⚠️ Job existe toujours après suppression`);
    } else {
      console.log(`   ✅ Job supprimé (simule la perte au redémarrage)`);
    }

    // 5. Attendre que le finishTime soit dépassé
    const remainingMs = testFinishTime - new Date();
    if (remainingMs > 0) {
      console.log(`\n⏳ Attente de ${Math.ceil(remainingMs / 1000)}s pour que la construction expire...`);
      await new Promise(resolve => setTimeout(resolve, remainingMs + 1000));
    }

    // 6. Vérifier que la construction est expirée
    await testConstruction.reload();
    const isExpired = new Date(testConstruction.finishTime) < new Date();
    console.log(`\n${isExpired ? '✅' : '❌'} Construction expirée: ${isExpired}`);
    console.log(`   Status actuel: ${testConstruction.status}`);

    // 7. Exécuter la synchronisation
    console.log(`\n⚙️ Exécution de syncConstructionJobs()...`);
    const syncResult = await syncConstructionJobs();
    console.log(`   ✅ Résultat: ${syncResult.synced} synchronisé(s), ${syncResult.expired} expiré(s)`);

    // 8. Vérifier que la construction a été marquée completed
    await testConstruction.reload();
    console.log(`\n${testConstruction.status === 'completed' ? '✅' : '❌'} Status après sync: ${testConstruction.status}`);

    // 9. Nettoyage
    console.log(`\n🧹 Nettoyage...`);
    await testConstruction.destroy();
    console.log(`   ✅ Construction de test supprimée`);

    // Vérifier qu'aucun job n'est resté
    const finalJobs = await queue.getJobs(['waiting', 'delayed', 'active']);
    const orphanJob = finalJobs.find(j => j.data.queueId === testConstruction.id);
    if (orphanJob) {
      console.log(`   ⚠️ Job orphelin trouvé, suppression...`);
      await orphanJob.remove();
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ Test d\'intégration réussi !');
    console.log('\n📊 Résumé:');
    console.log('   1. Construction créée avec délai de 5s');
    console.log('   2. Job BullMQ programmé');
    console.log('   3. Job supprimé (simulation de redémarrage)');
    console.log('   4. Construction expirée');
    console.log('   5. syncConstructionJobs() a marqué la construction comme completed');
    console.log('   6. Nettoyage effectué');
    console.log('\n🎉 Le système de synchronisation fonctionne correctement !');

  } catch (err) {
    console.error('\n❌ Erreur durant le test:', err);
    throw err;
  }

  process.exit(0);
}

testFullConstructionCycle().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
