const { sequelize } = require('./models');

async function findUserBuildings() {
  try {
    await sequelize.authenticate();
    
    console.log('👤 All users:');
    const users = await sequelize.query(`
      SELECT id, username, email 
      FROM users 
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });
    console.log(users);
    
    console.log('\n🏗️ All buildings with metal:');
    const buildings = await sequelize.query(`
      SELECT b.id, b.name, b.level, b.city_id, c.user_id, u.username
      FROM buildings b 
      JOIN cities c ON b.city_id = c.id 
      JOIN users u ON c.user_id = u.id
      WHERE b.name LIKE '%métal%'
      ORDER BY c.user_id, b.level DESC
    `, { type: sequelize.QueryTypes.SELECT });
    console.log(buildings);
    
    // Tester le service de production pour le premier utilisateur qui a une mine
    if (buildings.length > 0) {
      const userId = buildings[0].user_id;
      console.log(`\n🔬 Testing production calculation for user ${userId}:`);
      
      const container = require('./container');
      const productionService = container.resolve('productionCalculatorService');
      const rates = await productionService.calculateProductionRates(userId);
      
      console.log('\n📊 Calculated production rates:');
      console.log(`Gold: ${(rates.production.gold * 3600).toFixed(2)}/h`);
      console.log(`Metal: ${(rates.production.metal * 3600).toFixed(2)}/h`);
      console.log(`Fuel: ${(rates.production.fuel * 3600).toFixed(2)}/h`);
      console.log(`Energy: ${(rates.production.energy * 3600).toFixed(2)}/h`);
      
      console.log('\n📦 Storage capacities:');
      console.log(`Gold: ${rates.storage.gold}`);
      console.log(`Metal: ${rates.storage.metal}`);
      console.log(`Fuel: ${rates.storage.fuel}`);
      console.log(`Energy: ${rates.storage.energy}`);
    }
    
    await sequelize.close();
  } catch(e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

findUserBuildings();
