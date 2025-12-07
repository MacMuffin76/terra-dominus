/**
 * Script pour réparer les constructions bloquées
 * Trouve les constructions "in_progress" dont le finishTime est dépassé
 * et les marque comme "completed" ou les resynchronise
 */

const db = require('./db');
const ConstructionQueue = require('./models/ConstructionQueue');
const { Op } = require('sequelize');

async function fixStuckConstructions() {
  console.log('🔍 Recherche des constructions bloquées...\n');

  const now = new Date();
  
  // Trouver toutes les constructions in_progress dont le finishTime est dépassé
  const stuckItems = await ConstructionQueue.findAll({
    where: {
      status: 'in_progress',
      finishTime: {
        [Op.lt]: now
      }
    },
    order: [['cityId', 'ASC'], ['finishTime', 'ASC']]
  });

  if (stuckItems.length === 0) {
    console.log('✅ Aucune construction bloquée trouvée.');
    process.exit(0);
  }

  console.log(`❌ ${stuckItems.length} construction(s) bloquée(s) trouvée(s):\n`);
  
  for (const item of stuckItems) {
    const delayHours = Math.floor((now - new Date(item.finishTime)) / (1000 * 60 * 60));
    const delayMinutes = Math.floor((now - new Date(item.finishTime)) / (1000 * 60)) % 60;
    
    console.log(`  - ID: ${item.id}`);
    console.log(`    City: ${item.cityId}, Entity: ${item.entityId}`);
    console.log(`    Finish Time: ${item.finishTime}`);
    console.log(`    Delay: ${delayHours}h ${delayMinutes}min`);
    console.log('');
  }

  console.log('🔧 Réparation en cours...\n');

  let fixed = 0;
  
  for (const item of stuckItems) {
    try {
      // Option 1: Marquer comme completed
      // Ceci permettra au joueur de collecter la construction
      await item.update({
        status: 'completed'
      });
      
      console.log(`✅ Construction ${item.id} marquée comme 'completed'`);
      fixed++;
      
      // Alternative: Si vous voulez forcer la complétion immédiate
      // Vous devrez appeler buildingService.collectConstruction
      // mais cela nécessite le container DI
      
    } catch (err) {
      console.error(`❌ Erreur lors de la réparation de la construction ${item.id}:`, err.message);
    }
  }

  console.log(`\n✅ ${fixed}/${stuckItems.length} construction(s) réparée(s)`);
  
  // Afficher les constructions encore bloquées après réparation
  const remainingStuck = await ConstructionQueue.findAll({
    where: {
      status: 'in_progress',
      finishTime: {
        [Op.lt]: now
      }
    }
  });

  if (remainingStuck.length > 0) {
    console.log(`⚠️ ${remainingStuck.length} construction(s) encore bloquée(s)`);
  }

  process.exit(0);
}

fixStuckConstructions().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
