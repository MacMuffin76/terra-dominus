const sequelize = require('./db');

async function findUserData() {
  try {
    const [cities] = await sequelize.query(`
      SELECT c.id, c.name, c.user_id, c.is_capital, u.username
      FROM cities c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.user_id, c.is_capital DESC;
    `);

    console.log('\n=== Villes ===');
    cities.forEach(c => {
      console.log(`City ID: ${c.id} | User: ${c.username} (${c.user_id}) | ${c.name} ${c.is_capital ? '(CAPITALE)' : ''}`);
    });

    if (cities.length > 0) {
      const cityId = cities[0].id;
      
      const [resources] = await sequelize.query(`
        SELECT type, amount FROM resources WHERE city_id = :cityId;
      `, { replacements: { cityId } });

      console.log(`\n=== Ressources pour city_id ${cityId} ===`);
      if (resources.length > 0) {
        resources.forEach(r => {
          console.log(`  ${r.type}: ${r.amount}`);
        });
      } else {
        console.log('  Aucune ressource trouvée');
      }

      const [facilities] = await sequelize.query(`
        SELECT id, name, level FROM facilities WHERE city_id = :cityId;
      `, { replacements: { cityId } });

      console.log(`\n=== Facilities pour city_id ${cityId} ===`);
      if (facilities.length > 0) {
        facilities.forEach(f => {
          console.log(`  ${f.name}: niveau ${f.level}`);
        });
      } else {
        console.log('  Aucune facility trouvée');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findUserData();
