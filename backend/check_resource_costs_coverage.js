const sequelize = require('./db');

(async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        e.entity_id, 
        e.entity_name, 
        COUNT(rc.id) as cost_count,
        MIN(rc.level) as min_level,
        MAX(rc.level) as max_level
      FROM entities e
      LEFT JOIN resource_costs rc ON e.entity_id = rc.entity_id
      WHERE e.entity_type = 'building'
      GROUP BY e.entity_id, e.entity_name
      ORDER BY e.entity_name
    `);
    
    console.log('\n=== Coûts par bâtiment ===');
    results.forEach(r => {
      console.log(`  ${r.entity_id}: ${r.entity_name} -> ${r.cost_count} entrées (niveaux ${r.min_level || 'N/A'} à ${r.max_level || 'N/A'})`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
