const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query(
      'SELECT DISTINCT building_name FROM resource_production ORDER BY building_name;'
    );
    
    console.log('🏗️ Bâtiments dans resource_production:\n');
    results.forEach(r => console.log('  -', r.building_name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
