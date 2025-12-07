const sequelize = require('./db');

(async () => {
  try {
    const [buildings] = await sequelize.query(
      `SELECT entity_id, entity_name FROM entities 
       WHERE entity_type = 'building' 
       ORDER BY entity_name`
    );
    
    console.log('\n=== Tous les bâtiments dans entities ===');
    buildings.forEach(b => {
      console.log(`  ${b.entity_id}: "${b.entity_name}"`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
