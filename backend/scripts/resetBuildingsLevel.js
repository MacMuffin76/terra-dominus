// Script pour réinitialiser les bâtiments avec les bons niveaux
const { Building, Facility, City } = require('../models');

async function resetBuildingsToLevel1(userId = 4) {
  try {
    const city = await City.findOne({ where: { user_id: userId } });
    
    if (!city) {
      console.log(`❌ Aucune ville trouvée pour l'utilisateur ${userId}`);
      return;
    }

    console.log(`\n✅ Ville: ${city.name} (ID: ${city.id})`);

    // Mettre à jour tous les bâtiments à niveau 1
    const [updatedBuildings] = await Building.update(
      { level: 1 },
      { where: { city_id: city.id, level: 0 } }
    );

    console.log(`\n📦 ${updatedBuildings} bâtiment(s) de ressources mis à niveau 1`);

    // Mettre à jour toutes les installations à niveau 1
    const [updatedFacilities] = await Facility.update(
      { level: 1 },
      { where: { city_id: city.id, level: 0 } }
    );

    console.log(`🏛️  ${updatedFacilities} installation(s) mises à niveau 1`);

    // Afficher le résultat
    const buildings = await Building.findAll({ 
      where: { city_id: city.id },
      order: [['name', 'ASC']]
    });

    console.log(`\n📋 État final des bâtiments:`);
    buildings.forEach(b => {
      console.log(`  ✓ ${b.name}: niveau ${b.level}`);
    });

    const facilities = await Facility.findAll({ 
      where: { city_id: city.id },
      order: [['name', 'ASC']]
    });

    console.log(`\n📋 État final des installations:`);
    facilities.forEach(f => {
      console.log(`  ✓ ${f.name}: niveau ${f.level}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

const userId = process.argv[2] ? parseInt(process.argv[2]) : 4;
resetBuildingsToLevel1(userId);
