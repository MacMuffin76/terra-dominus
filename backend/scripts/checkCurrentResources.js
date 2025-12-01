const sequelize = require('../db');
const User = require('../models/User');
const City = require('../models/City');
const Resource = require('../models/Resource');

async function checkResources() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');

    const user = await User.findOne({ where: { username: 'MacMuffin76' } });
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    const city = await City.findOne({ where: { user_id: user.id } });
    if (!city) {
      console.log('❌ Ville non trouvée');
      process.exit(1);
    }

    const resources = await Resource.findAll({
      where: { city_id: city.id },
      order: [['type', 'ASC']]
    });

    console.log('\n📊 Ressources actuelles:');
    resources.forEach(r => {
      console.log(`${r.type}: ${r.amount} (dernière mise à jour: ${r.last_update})`);
    });

    // Attendre 70 secondes et revérifier
    console.log('\n⏳ Attente de 70 secondes pour vérifier la production...\n');
    
    await new Promise(resolve => setTimeout(resolve, 70000));

    const resourcesAfter = await Resource.findAll({
      where: { city_id: city.id },
      order: [['type', 'ASC']]
    });
    
    console.log('\n📊 Ressources après 70 secondes:');
    resourcesAfter.forEach(r => {
      console.log(`${r.type}: ${r.amount} (dernière mise à jour: ${r.last_update})`);
    });

    console.log('\n📈 Différences:');
    resources.forEach((r, idx) => {
      const diff = resourcesAfter[idx].amount - r.amount;
      console.log(`${r.type}: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`);
    });

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

checkResources();
