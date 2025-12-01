const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Resource = require('../models/Resource');

async function initializeEnergy() {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { username: 'MacMuffin76' } });
    const city = await City.findOne({ where: { user_id: user.id } });
    
    // Donner 1000 unités d'énergie pour démarrer la production
    await Resource.update(
      { amount: 1000, last_update: new Date() },
      { where: { city_id: city.id, type: 'energie' } }
    );
    
    console.log('✅ Énergie initialisée à 1000');
    console.log('Les mines vont maintenant pouvoir produire !');
    console.log('Attendez 60 secondes et vérifiez vos ressources.');
    
    await sequelize.close();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

initializeEnergy();
