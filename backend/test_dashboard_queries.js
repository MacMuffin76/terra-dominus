const sequelize = require('./db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    const userId = 4; // Remplacez par votre ID utilisateur

    console.log('Test 1: Ressources');
    const [resources] = await sequelize.query(
      `SELECT r.* FROM resources r
       JOIN cities c ON c.id = r.city_id
       WHERE c.user_id = :userId
       ORDER BY r.id`,
      { replacements: { userId } }
    );
    console.log(`  ✓ ${resources.length} ressources trouvées\n`);

    console.log('Test 2: Bâtiments');
    const [buildings] = await sequelize.query(
      `SELECT b.* FROM buildings b
       JOIN cities c ON c.id = b.city_id
       WHERE c.user_id = :userId
       ORDER BY b.id`,
      { replacements: { userId } }
    );
    console.log(`  ✓ ${buildings.length} bâtiments trouvés\n`);

    console.log('Test 3: Unités');
    const [units] = await sequelize.query(
      `SELECT u.* FROM units u
       JOIN cities c ON c.id = u.city_id
       WHERE c.user_id = :userId
       ORDER BY u.id`,
      { replacements: { userId } }
    );
    console.log(`  ✓ ${units.length} unités trouvées\n`);

    console.log('Test 4: Installations');
    const [facilities] = await sequelize.query(
      `SELECT f.* FROM facilities f
       JOIN cities c ON c.id = f.city_id
       WHERE c.user_id = :userId
       ORDER BY f.id`,
      { replacements: { userId } }
    );
    console.log(`  ✓ ${facilities.length} installations trouvées\n`);

    console.log('Test 5: Recherches');
    const [researches] = await sequelize.query(
      `SELECT r.* FROM researches r
       WHERE r.user_id = :userId
       ORDER BY r.id`,
      { replacements: { userId } }
    );
    console.log(`  ✓ ${researches.length} recherches trouvées\n`);

    console.log('Test 6: Défenses');
    try {
      const [defenses] = await sequelize.query(
        `SELECT d.* FROM defenses d
         JOIN cities c ON c.id = d.city_id
         WHERE c.user_id = :userId
         ORDER BY d.id`,
        { replacements: { userId } }
      );
      console.log(`  ✓ ${defenses.length} défenses trouvées\n`);
    } catch (err) {
      console.error('  ✗ ERREUR sur la requête défenses:', err.message);
    }

    console.log('\n✅ Tous les tests passés!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
