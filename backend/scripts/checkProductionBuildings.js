const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Building = require('../models/Building');

async function checkBuildings() {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { username: 'MacMuffin76' } });
    const city = await City.findOne({ where: { user_id: user.id } });
    
    const buildings = await Building.findAll({
      where: { city_id: city.id },
      order: [['name', 'ASC']]
    });
    
    console.log('📦 Bâtiments de production:');
    const productionBuildings = buildings.filter(b => 
      ['Mine d\'or', 'Mine de métal', 'Extracteur', 'Centrale électrique', 'Hangar', 'Réservoir'].includes(b.name)
    );
    
    productionBuildings.forEach(b => {
      console.log(`${b.name}: niveau ${b.level}`);
    });
    
    await sequelize.close();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

checkBuildings();
