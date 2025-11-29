// Script pour vérifier les bâtiments d'un utilisateur
const { Building, Facility, City } = require('../models');

async function checkUserBuildings(userId = 4) {
  try {
    // Trouver la ville de l'utilisateur
    const city = await City.findOne({ where: { user_id: userId } });
    
    if (!city) {
      console.log(`❌ Aucune ville trouvée pour l'utilisateur ${userId}`);
      return;
    }

    console.log(`\n✅ Ville trouvée: ${city.name} (ID: ${city.id})`);

    // Vérifier les bâtiments de ressources
    const buildings = await Building.findAll({ 
      where: { city_id: city.id },
      order: [['id', 'ASC']]
    });

    console.log(`\n📦 Bâtiments de ressources (${buildings.length}):`);
    buildings.forEach(b => {
      console.log(`  - ${b.name} (niveau ${b.level})`);
    });

    // Vérifier les installations
    const facilities = await Facility.findAll({ 
      where: { city_id: city.id },
      order: [['id', 'ASC']]
    });

    console.log(`\n🏛️  Installations (${facilities.length}):`);
    facilities.forEach(f => {
      console.log(`  - ${f.name} (niveau ${f.level})`);
    });

    if (buildings.length === 0) {
      console.log('\n⚠️  Aucun bâtiment de ressources trouvé !');
    }

    if (facilities.length === 0) {
      console.log('\n⚠️  Aucune installation trouvée !');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    process.exit(0);
  }
}

// Lancer la vérification
const userId = process.argv[2] ? parseInt(process.argv[2]) : 4;
checkUserBuildings(userId);
