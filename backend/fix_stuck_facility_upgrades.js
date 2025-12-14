require('dotenv').config();
const createContainer = require('./container');
const sequelize = require('./db');

async function fixStuckFacilityUpgrades() {
  const container = createContainer();
  const facilityService = container.resolve('facilityService');

  try {
    console.log('\n🔧 Correction des mises à niveau bloquées...\n');

    // Trouver toutes les constructions de facilities expirées mais encore "in_progress"
    const [stuckConstructions] = await sequelize.query(`
      SELECT 
        cq.id as queue_id,
        cq.city_id,
        cq.entity_id,
        cq.type,
        cq.status,
        cq.finish_time,
        e.entity_name,
        c.user_id,
        EXTRACT(EPOCH FROM (NOW() - cq.finish_time)) as seconds_overdue
      FROM construction_queue cq
      LEFT JOIN entities e ON e.entity_id = cq.entity_id
      LEFT JOIN cities c ON c.id = cq.city_id
      WHERE cq.type = 'facility' 
        AND cq.status = 'in_progress'
        AND cq.finish_time <= NOW()
      ORDER BY cq.finish_time;
    `);

    if (stuckConstructions.length === 0) {
      console.log('✅ Aucune construction bloquée trouvée. Tout est normal!');
      process.exit(0);
      return;
    }

    console.log(`📋 ${stuckConstructions.length} construction(s) bloquée(s) trouvée(s):\n`);

    for (const construction of stuckConstructions) {
      console.log(`\n⚙️  Traitement de: ${construction.entity_name}`);
      console.log(`   Queue ID: ${construction.queue_id}`);
      console.log(`   Ville: ${construction.city_id}`);
      console.log(`   En retard de: ${Math.round(construction.seconds_overdue)}s`);

      try {
        // Appeler la méthode de finalisation
        const result = await facilityService.finalizeFacilityUpgrade(
          construction.queue_id,
          construction.user_id
        );

        console.log(`   ✅ ${result.message}`);
        if (result.facility) {
          console.log(`      ${result.facility.name} → Niveau ${result.facility.level}`);
        }
      } catch (err) {
        console.error(`   ❌ Erreur:`, err.message);
      }
    }

    console.log('\n\n✨ Traitement terminé!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  }
}

fixStuckFacilityUpgrades();
