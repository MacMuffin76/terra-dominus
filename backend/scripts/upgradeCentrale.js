const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Building = require('../models/Building');

async function upgradeCentrale() {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { username: 'MacMuffin76' } });
    const city = await City.findOne({ where: { user_id: user.id } });
    
    const centrale = await Building.findOne({
      where: { city_id: city.id, name: 'Centrale électrique' }
    });
    
    if (!centrale) {
      console.log('❌ Centrale électrique non trouvée');
      process.exit(1);
    }
    
    console.log('Centrale actuelle: niveau', centrale.level);
    console.log('Mise à niveau vers niveau 2...');
    
    await Building.update(
      { level: 2 },
      { where: { id: centrale.id } }
    );
    
    console.log('✅ Centrale électrique maintenant au niveau 2');
    console.log('Production d\'énergie: 55/s');
    console.log('Consommation: 13/s');
    console.log('Net: +42/s → Les mines vont maintenant produire !');
    
    await sequelize.close();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

upgradeCentrale();
