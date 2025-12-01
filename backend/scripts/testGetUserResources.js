const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Building = require('../models/Building');
const resourceService = require('../services/resourceService');

async function testGetUserResources() {
  try {
    await sequelize.authenticate();
    
    // ID de MacMuffin76
    const userId = 4;
    
    // D'abord, vérifions les bâtiments bruts
    const user = await User.findOne({ where: { id: userId } });
    const city = await City.findOne({ where: { user_id: user.id } });
    const buildings = await Building.findAll({ where: { city_id: city.id } });
    
    console.log('🏗️  Bâtiments en base:');
    buildings.forEach(b => {
      if (['Centrale électrique', 'Mine d\'or', 'Mine de métal', 'Extracteur'].includes(b.name)) {
        console.log(`  ${b.name}: niveau ${b.level}`);
      }
    });
    
    console.log('\n📊 Test getUserResources pour userId:', userId);
    const result = await resourceService.getUserResources(userId);
    
    console.log('\n🎯 Résultat:');
    result.forEach(r => {
      console.log(`${r.type}:`);
      console.log(`  - Quantité: ${r.amount}`);
      console.log(`  - Niveau bâtiment: ${r.level}`);
      console.log(`  - Taux production: ${r.production_rate}/s`);
      console.log(`  - Production/min: ${(r.production_rate * 60).toFixed(2)}`);
    });
    
    await sequelize.close();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testGetUserResources();
