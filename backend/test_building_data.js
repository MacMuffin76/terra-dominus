const sequelize = require('./db');

(async () => {
  try {
    // Test avec "Mine de métal" niveau 3
    console.log('\n=== Test Mine de métal niveau 3 ===');
    const [prod1] = await sequelize.query(
      `SELECT * FROM resource_production 
       WHERE building_name = 'Mine de métal' AND level = 3`
    );
    console.log('Production trouvée:', prod1);

    // Test entity_id pour Mine de métal
    console.log('\n=== entity_id pour Mine de métal ===');
    const [entity1] = await sequelize.query(
      `SELECT entity_id FROM entities 
       WHERE entity_type = 'building' AND entity_name = 'Mine de métal'`
    );
    console.log('Entity:', entity1);

    // Test resource_costs pour Mine de métal niveau 3
    if (entity1.length > 0) {
      console.log('\n=== Coûts pour Mine de métal niveau 4 ===');
      const [costs1] = await sequelize.query(
        `SELECT * FROM resource_costs 
         WHERE entity_id = ${entity1[0].entity_id} AND level = 4
         ORDER BY resource_type`
      );
      console.log('Coûts:', costs1);
    }

    // Test avec "Extracteur" niveau 3
    console.log('\n=== Test Extracteur niveau 3 ===');
    const [prod2] = await sequelize.query(
      `SELECT * FROM resource_production 
       WHERE building_name = 'Extracteur' AND level = 3`
    );
    console.log('Production trouvée:', prod2);

    const [entity2] = await sequelize.query(
      `SELECT entity_id FROM entities 
       WHERE entity_type = 'building' AND entity_name = 'Extracteur'`
    );
    console.log('Entity:', entity2);

    if (entity2.length > 0) {
      console.log('\n=== Coûts pour Extracteur niveau 4 ===');
      const [costs2] = await sequelize.query(
        `SELECT * FROM resource_costs 
         WHERE entity_id = ${entity2[0].entity_id} AND level = 4
         ORDER BY resource_type`
      );
      console.log('Coûts:', costs2);
    }

    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
