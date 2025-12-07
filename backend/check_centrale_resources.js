const sequelize = require('./db');

(async () => {
  try {
    // Vérifier les ressources pour user_id = 1
    console.log('\n=== Ressources actuelles (user_id = 1) ===');
    const [resources] = await sequelize.query(`
      SELECT r.type, r.amount, c.name as city_name
      FROM resources r
      JOIN cities c ON c.id = r.city_id
      WHERE c.user_id = 1
      ORDER BY r.type
    `);
    
    resources.forEach(r => {
      console.log(`  ${r.type}: ${r.amount} (ville: ${r.city_name})`);
    });

    // Vérifier les coûts pour Centrale électrique niveau 3
    console.log('\n=== Coûts Centrale électrique niveau 3 ===');
    const [costs] = await sequelize.query(`
      SELECT rc.resource_type, rc.amount
      FROM resource_costs rc
      JOIN entities e ON e.entity_id = rc.entity_id
      WHERE e.entity_name = 'Centrale électrique'
      AND rc.level = 3
      ORDER BY rc.resource_type
    `);
    
    costs.forEach(c => {
      console.log(`  ${c.resource_type}: ${c.amount}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
