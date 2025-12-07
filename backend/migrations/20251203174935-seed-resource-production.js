'use strict';

const { getProductionPerSecond } = require('../utils/balancing');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Récupérer les IDs des bâtiments de ressources
    const [buildings] = await queryInterface.sequelize.query(
      `SELECT entity_id, entity_name FROM entities 
       WHERE entity_type = 'building' 
       AND entity_name IN ('Mine de métal', 'Mine d''or', 'Extracteur', 'Centrale électrique')
       ORDER BY entity_name;`
    );

    console.log('\n📊 Génération des taux de production pour 50 niveaux...\n');

    const productionData = [];
    const buildingIdMap = {};

    // Mapper les noms aux IDs
    buildings.forEach(b => {
      buildingIdMap[b.entity_name] = b.entity_id;
      console.log(`✓ ${b.entity_name} (ID: ${b.entity_id})`);
    });

    console.log('\n🔄 Calcul des productions...\n');

    // Pour chaque bâtiment, générer 50 niveaux
    const buildingNames = ['Mine de métal', "Mine d'or", 'Extracteur', 'Centrale électrique'];
    
    for (const buildingName of buildingNames) {
      const buildingId = buildingIdMap[buildingName];
      if (!buildingId) continue;

      for (let level = 1; level <= 50; level++) {
        let productionRate;
        
        if (buildingName === 'Centrale électrique') {
          // Centrale = capacité fixe d'énergie (pas de production/s)
          productionRate = level * 50;
        } else {
          // Pour les mines : production par seconde * 3600 = production par heure
          const perSecond = getProductionPerSecond(buildingName, level);
          productionRate = Math.round(perSecond * 3600 * 100) / 100; // Arrondi à 2 décimales
        }

        productionData.push({
          building_id: 1, // ID arbitraire pour satisfaire la contrainte
          building_name: buildingName,
          resource_type_id: 1, // ID arbitraire
          amount: 0,
          level: level,
          production_rate: productionRate,
          last_updated: new Date(),
        });

        if (level === 1 || level === 10 || level === 20 || level === 30 || level === 50) {
          console.log(`  ${buildingName} niv.${level}: ${productionRate}/h`);
        }
      }
      console.log('');
    }

    // Vider la table avant d'insérer
    await queryInterface.bulkDelete('resource_production', null, {});

    // Désactiver temporairement les contraintes de clé étrangère
    await queryInterface.sequelize.query('ALTER TABLE resource_production DISABLE TRIGGER ALL;');

    // Insérer toutes les données
    await queryInterface.bulkInsert('resource_production', productionData);

    // Réactiver les contraintes
    await queryInterface.sequelize.query('ALTER TABLE resource_production ENABLE TRIGGER ALL;');

    console.log(`\n✅ ${productionData.length} entrées créées avec succès!\n`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('resource_production', null, {});
  }
};
