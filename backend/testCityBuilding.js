/**
 * Simple test to check if we can get buildings via city
 */

const { sequelize, City, Building } = require('./models');

async function test() {
  try {
    console.log('=== Testing City-Building relationship ===\n');

    // Get user 78's cities
    const cities = await City.findAll({
      where: { user_id: 78 }
    });

    console.log(`User 78 has ${cities.length} cities\n`);

    if (cities.length > 0) {
      const city = cities[0];
      console.log(`City: ID=${city.id}, Name=${city.name}`);

      // Try to get buildings for this city
      const buildings = await Building.findAll({
        where: { city_id: city.id }
      });

      console.log(`City has ${buildings.length} buildings:`);
      buildings.forEach(b => {
        console.log(`  - ${b.name} (level ${b.level})`);
      });
    }

    // Now try with include (this will fail if no association)
    console.log('\nTrying with include...');
    try {
      const citiesWithBuildings = await City.findAll({
        where: { user_id: 78 },
        include: [{
          model: Building,
          as: 'buildings'
        }]
      });
      console.log('✅ Include works!');
    } catch (error) {
      console.log('❌ Include failed:', error.message);
      
      // Try without alias
      console.log('\nTrying without alias...');
      try {
        const citiesWithBuildings = await City.findAll({
          where: { user_id: 78 },
          include: [Building]
        });
        console.log('✅ Include without alias works!');
      } catch (error2) {
        console.log('❌ Include without alias also failed:', error2.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

test();
