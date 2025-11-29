// Script pour corriger les noms des installations
const { Facility, City } = require('../models');

async function fixFacilityNames(userId = 4) {
  try {
    const city = await City.findOne({ where: { user_id: userId } });
    
    if (!city) {
      console.log(`❌ Aucune ville trouvée pour l'utilisateur ${userId}`);
      return;
    }

    console.log(`\n✅ Ville: ${city.name} (ID: ${city.id})`);

    // Corriger "Centre de Recherche" en "Laboratoire de Recherche"
    const [updated1] = await Facility.update(
      { name: 'Laboratoire de Recherche' },
      { where: { city_id: city.id, name: 'Centre de Recherche' } }
    );

    if (updated1 > 0) {
      console.log(`\n✓ Renommé "Centre de Recherche" → "Laboratoire de Recherche"`);
    }

    // Corriger "Terrain d'Entrainement" en "Terrain d'Entraînement" (avec accent)
    const [updated2] = await Facility.update(
      { name: "Terrain d'Entraînement" },
      { where: { city_id: city.id, name: "Terrain d'Entrainement" } }
    );

    if (updated2 > 0) {
      console.log(`✓ Renommé "Terrain d'Entrainement" → "Terrain d'Entraînement"`);
    }

    // Vérifier si "Centre de Commandement" existe
    const commandCenter = await Facility.findOne({
      where: { city_id: city.id, name: 'Centre de Commandement' }
    });

    if (!commandCenter) {
      console.log(`\n⚠️  "Centre de Commandement" manquant - Création...`);
      await Facility.create({
        city_id: city.id,
        name: 'Centre de Commandement',
        level: 1
      });
      console.log(`✓ "Centre de Commandement" créé au niveau 1`);
    }

    // Afficher le résultat final
    const facilities = await Facility.findAll({ 
      where: { city_id: city.id },
      order: [['name', 'ASC']]
    });

    console.log(`\n📋 Installations finales (${facilities.length}):`);
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
fixFacilityNames(userId);
