const { sequelize } = require('./models');
const ResourceProduction = require('./models/ResourceProduction');

async function checkProductionRates() {
  try {
    await sequelize.authenticate();
    
    console.log('📊 Production rates for Mine de métal:');
    const metalMines = await ResourceProduction.findAll({ 
      where: { building_name: 'Mine de métal' }, 
      order: [['level', 'ASC']] 
    });
    
    metalMines.forEach(m => {
      console.log(`Level ${m.level}: ${m.production_rate}/h (${(m.production_rate/3600).toFixed(4)}/s)`);
    });
    
    console.log('\n🏗️ User 1 metal buildings:');
    const userBuildings = await sequelize.query(`
      SELECT b.id, b.name, b.level, c.user_id 
      FROM buildings b 
      JOIN cities c ON b.city_id = c.id 
      WHERE c.user_id = 1 AND b.name LIKE '%métal%'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(userBuildings);
    
    if (userBuildings.length > 0) {
      const building = userBuildings[0];
      console.log(`\n🔍 Expected production for level ${building.level}:`);
      const expectedRate = metalMines.find(m => m.level === building.level);
      if (expectedRate) {
        console.log(`${expectedRate.production_rate}/h`);
      } else {
        console.log('❌ No production rate found for this level!');
      }
    }
    
    await sequelize.close();
  } catch(e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

checkProductionRates();
