const { sequelize } = require('./models');
const Building = require('./models/Building');
const City = require('./models/City');
const ResourceProduction = require('./models/ResourceProduction');

async function testProductionCalculation() {
  try {
    await sequelize.authenticate();
    
    const userId = 95; // MacMuffin76
    
    // Récupérer la ville
    const city = await City.findOne({ where: { user_id: userId, is_capital: true } });
    console.log('🏙️ City:', city.toJSON());
    
    // Récupérer tous les bâtiments
    const buildings = await Building.findAll({ where: { city_id: city.id } });
    console.log('\n🏗️ All buildings:');
    buildings.forEach(b => {
      console.log(`  ${b.name} - Level ${b.level}`);
    });
    
    // Trouver la mine de métal
    const metalMine = buildings.find(b => b.name === 'Mine de métal');
    if (metalMine) {
      console.log('\n⛏️ Mine de métal found:');
      console.log(`  Level: ${metalMine.level}`);
      
      // Chercher le taux dans resource_production
      const productionData = await ResourceProduction.findOne({
        where: {
          building_name: 'Mine de métal',
          level: metalMine.level
        }
      });
      
      if (productionData) {
        console.log(`\n📊 Production data from table:`);
        console.log(`  Rate: ${productionData.production_rate}/h`);
        console.log(`  Per second: ${(productionData.production_rate / 3600).toFixed(4)}/s`);
      } else {
        console.log(`\n❌ NO PRODUCTION DATA FOUND FOR LEVEL ${metalMine.level}!`);
      }
    }
    
    // Vérifier toutes les lignes de Mine de métal
    console.log('\n📋 All Mine de métal entries in resource_production:');
    const allMetal = await ResourceProduction.findAll({
      where: { building_name: 'Mine de métal' },
      order: [['level', 'ASC']]
    });
    allMetal.forEach(m => {
      console.log(`  Level ${m.level}: ${m.production_rate}/h`);
    });
    
    await sequelize.close();
  } catch(e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

testProductionCalculation();
