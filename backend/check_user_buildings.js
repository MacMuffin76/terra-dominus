const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    // Vérifier les bâtiments de l'utilisateur 4
    const [buildings] = await sequelize.query(
      "SELECT id, name, level, city_id FROM buildings WHERE city_id IN (SELECT id FROM cities WHERE user_id = 4) ORDER BY name;"
    );

    console.log('🏗️ Bâtiments de l\'utilisateur 4:\n');
    buildings.forEach(b => {
      console.log(`  ${b.name} (ID: ${b.id}) - Niveau ${b.level}`);
    });

    console.log('\n📊 Vérification production pour chaque bâtiment:\n');
    
    for (const building of buildings) {
      const [prod] = await sequelize.query(
        `SELECT production_rate FROM resource_production WHERE building_name = :name AND level = :level;`,
        {
          replacements: { name: building.name, level: building.level }
        }
      );
      
      if (prod.length > 0) {
        console.log(`  ✓ ${building.name} niv.${building.level}: ${prod[0].production_rate}/h`);
      } else {
        console.log(`  ✗ ${building.name} niv.${building.level}: AUCUNE DONNÉE`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
