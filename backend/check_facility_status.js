const sequelize = require('./db');

async function checkResources() {
  try {
    // Remplacez par votre city_id
    const cityId = 1;
    
    const [resources] = await sequelize.query(`
      SELECT type, amount FROM resources WHERE city_id = :cityId ORDER BY type;
    `, { replacements: { cityId } });

    console.log('\n=== Ressources actuelles ===');
    resources.forEach(r => {
      console.log(`${r.type.padEnd(15)}: ${r.amount.toLocaleString()}`);
    });

    const [facility] = await sequelize.query(`
      SELECT name, level FROM facilities WHERE city_id = :cityId AND name LIKE '%Recherche%';
    `, { replacements: { cityId } });

    console.log('\n=== Laboratoire de Recherche ===');
    if (facility.length > 0) {
      console.log(`Niveau actuel: ${facility[0].level}`);
    } else {
      console.log('Pas encore construit');
    }

    const [queue] = await sequelize.query(`
      SELECT cq.*, e.entity_name, cq.finish_time
      FROM construction_queue cq
      LEFT JOIN entities e ON e.entity_id = cq.entity_id
      WHERE cq.city_id = :cityId AND cq.type = 'facility' AND cq.status = 'in_progress';
    `, { replacements: { cityId } });

    console.log('\n=== File de construction ===');
    if (queue.length > 0) {
      queue.forEach(q => {
        const remaining = Math.max(0, Math.ceil((new Date(q.finish_time) - new Date()) / 1000));
        console.log(`${q.entity_name}: ${q.status} - Reste ${remaining}s`);
      });
    } else {
      console.log('Aucune construction en cours');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkResources();
