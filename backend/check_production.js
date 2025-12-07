const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    // Vérifier la structure de la table
    const [columns] = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='resource_production' ORDER BY ordinal_position;"
    );
    
    console.log('📋 Colonnes de la table resource_production:');
    columns.forEach(c => console.log(`  - ${c.column_name}`));
    console.log('');

    // Récupérer les données
    const [productions] = await sequelize.query(
      "SELECT * FROM resource_production ORDER BY level LIMIT 20;"
    );

    if (productions.length === 0) {
      console.log('❌ Aucune donnée dans resource_production\n');
    } else {
      console.log('📊 Données de production:\n');
      productions.forEach(p => {
        console.log(JSON.stringify(p, null, 2));
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
