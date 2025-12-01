const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Building = require('../models/Building');
const Resource = require('../models/Resource');

const ENERGY_CONSUMPTION_PER_LEVEL = 1;

function calculateEnergyProduction(centraleLevel) {
  if (centraleLevel === 0) return 0;
  return Math.floor(50 * Math.pow(1.1, centraleLevel - 1));
}

async function checkEnergy() {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { username: 'MacMuffin76' } });
    const city = await City.findOne({ where: { user_id: user.id } });
    
    const buildings = await Building.findAll({ where: { city_id: city.id } });
    const centrale = buildings.find(b => b.name === 'Centrale électrique');
    const centraleLevel = centrale ? centrale.level : 0;
    
    const energyProduction = calculateEnergyProduction(centraleLevel);
    
    const productionBuildings = buildings.filter(b => 
      ['Mine de métal', 'Mine d\'or', 'Extracteur'].includes(b.name)
    );
    
    const energyConsumption = productionBuildings.reduce((sum, b) => 
      sum + Math.max(0, b.level) * ENERGY_CONSUMPTION_PER_LEVEL, 0
    );
    
    const energyResource = await Resource.findOne({
      where: { city_id: city.id, type: 'energie' }
    });
    
    console.log('⚡ État énergétique:');
    console.log('Production:', energyProduction, '/s (Centrale niveau', centraleLevel + ')');
    console.log('Consommation:', energyConsumption, '/s');
    console.log('  - Mine d\'or:', productionBuildings.find(b => b.name === 'Mine d\'or')?.level || 0, '→', (productionBuildings.find(b => b.name === 'Mine d\'or')?.level || 0) * ENERGY_CONSUMPTION_PER_LEVEL, 'énergie/s');
    console.log('  - Mine de métal:', productionBuildings.find(b => b.name === 'Mine de métal')?.level || 0, '→', (productionBuildings.find(b => b.name === 'Mine de métal')?.level || 0) * ENERGY_CONSUMPTION_PER_LEVEL, 'énergie/s');
    console.log('  - Extracteur:', productionBuildings.find(b => b.name === 'Extracteur')?.level || 0, '→', (productionBuildings.find(b => b.name === 'Extracteur')?.level || 0) * ENERGY_CONSUMPTION_PER_LEVEL, 'énergie/s');
    console.log('Net:', energyProduction - energyConsumption, '/s');
    console.log('Énergie stockée:', energyResource?.amount || 0);
    console.log('');
    
    if (energyProduction - energyConsumption >= 0 || (energyResource?.amount || 0) > 0) {
      console.log('✅ Assez d\'énergie pour produire');
    } else {
      console.log('❌ PAS ASSEZ D\'ÉNERGIE - Production stoppée !');
    }
    
    await sequelize.close();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

checkEnergy();
