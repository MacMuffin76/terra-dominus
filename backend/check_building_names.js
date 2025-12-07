const sequelize = require('./db');

(async () => {
  try {
    console.log('\n=== Noms dans resource_production ===');
    const [production] = await sequelize.query(
      'SELECT DISTINCT building_name FROM resource_production ORDER BY building_name'
    );
    production.forEach(r => {
      console.log(`  "${r.building_name}"`);
    });

    console.log('\n=== Noms dans entities (buildings) ===');
    const [entities] = await sequelize.query(
      `SELECT entity_id, entity_name FROM entities 
       WHERE entity_type = 'building' 
       AND (entity_name LIKE '%Mine%' OR entity_name LIKE '%Raffinerie%' 
            OR entity_name LIKE '%Centrale%' OR entity_name LIKE '%Hangar%'
            OR entity_name LIKE '%Réservoir%')
       ORDER BY entity_name`
    );
    entities.forEach(r => {
      console.log(`  ${r.entity_id}: "${r.entity_name}"`);
    });

    console.log('\n=== Noms dans buildings (user data) ===');
    const [buildings] = await sequelize.query(
      `SELECT DISTINCT name FROM buildings 
       WHERE name LIKE '%Mine%' OR name LIKE '%Raffinerie%' 
          OR name LIKE '%Centrale%' OR name LIKE '%Hangar%'
          OR name LIKE '%Réservoir%'
       ORDER BY name`
    );
    buildings.forEach(r => {
      console.log(`  "${r.name}"`);
    });

    console.log('\n=== Exemple resource_costs pour Mine de métal ===');
    const [costs] = await sequelize.query(
      `SELECT rc.entity_id, e.entity_name, rc.level, rc.resource_type, rc.amount 
       FROM resource_costs rc
       JOIN entities e ON e.entity_id = rc.entity_id
       WHERE e.entity_name LIKE '%Mine%' AND rc.level <= 5
       ORDER BY e.entity_name, rc.level, rc.resource_type`
    );
    costs.forEach(r => {
      console.log(`  ${r.entity_name} L${r.level}: ${r.resource_type} = ${r.amount}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
