const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    const userId = 4;

    // Vérifier les installations
    console.log('🏭 INSTALLATIONS:');
    const [facilities] = await sequelize.query(
      `SELECT f.* FROM facilities f
       JOIN cities c ON c.id = f.city_id
       WHERE c.user_id = :userId
       ORDER BY f.id`,
      { replacements: { userId } }
    );
    console.log(`  Trouvées: ${facilities.length}`);
    facilities.forEach(f => console.log(`  - ${f.name} (niv.${f.level})`));

    // Vérifier les recherches
    console.log('\n🔬 RECHERCHES:');
    const [researches] = await sequelize.query(
      `SELECT r.* FROM researches r
       WHERE r.user_id = :userId
       ORDER BY r.id`,
      { replacements: { userId } }
    );
    console.log(`  Trouvées: ${researches.length}`);
    researches.forEach(r => console.log(`  - ${r.name} (niv.${r.level})`));

    // Vérifier structure des tables
    console.log('\n📋 STRUCTURE facilities:');
    const [facStructure] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'facilities' ORDER BY ordinal_position");
    console.log('  Colonnes:', facStructure.map(c => c.column_name).join(', '));

    console.log('\n📋 STRUCTURE researches:');
    const [resStructure] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'researches' ORDER BY ordinal_position");
    console.log('  Colonnes:', resStructure.map(c => c.column_name).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();
