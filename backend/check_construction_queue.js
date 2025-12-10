const sequelize = require('./db');

async function checkConstructionQueue() {
  try {
    const cityId = 86; // Votre city_id
    
    const [queue] = await sequelize.query(`
      SELECT 
        cq.id,
        cq.city_id,
        cq.entity_id,
        cq.type,
        cq.status,
        cq.start_time,
        cq.finish_time,
        cq.slot,
        e.entity_name,
        EXTRACT(EPOCH FROM (cq.finish_time - NOW())) as remaining_seconds
      FROM construction_queue cq
      LEFT JOIN entities e ON e.entity_id = cq.entity_id
      WHERE cq.city_id = :cityId
      ORDER BY cq.slot;
    `, { replacements: { cityId } });

    console.log('\n=== File de construction (construction_queue) ===');
    if (queue.length === 0) {
      console.log('Aucune construction dans la queue');
    } else {
      queue.forEach(q => {
        const remaining = Math.max(0, Math.ceil(q.remaining_seconds || 0));
        const isFinished = remaining === 0;
        console.log(`
  ID: ${q.id}
  Entité: ${q.entity_name || 'N/A'}
  Type: ${q.type}
  Status: ${q.status}
  Slot: ${q.slot}
  Début: ${q.start_time}
  Fin: ${q.finish_time}
  Reste: ${remaining}s ${isFinished ? '⏰ TERMINÉ!' : ''}
        `);
      });
    }

    // Vérifier les facilities
    const [facilities] = await sequelize.query(`
      SELECT name, level FROM facilities WHERE city_id = :cityId ORDER BY name;
    `, { replacements: { cityId } });

    console.log('\n=== Facilities actuelles ===');
    facilities.forEach(f => {
      console.log(`  ${f.name}: niveau ${f.level}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConstructionQueue();
