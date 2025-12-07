'use strict';

/**
 * Migration pour ajouter les coûts manquants dans resource_costs
 * pour Mine de métal, Centrale électrique, et Réservoir
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🔧 Ajout des coûts manquants pour les bâtiments de ressources...\n');

    // Récupérer les entity_id
    const [entities] = await queryInterface.sequelize.query(
      `SELECT entity_id, entity_name FROM entities 
       WHERE entity_type = 'building' 
       AND entity_name IN ('Mine de métal', 'Centrale électrique', 'Réservoir')
       ORDER BY entity_name`
    );

    const entityMap = {};
    entities.forEach(e => {
      entityMap[e.entity_name] = e.entity_id;
      console.log(`✓ ${e.entity_name} (entity_id: ${e.entity_id})`);
    });

    const resourceCosts = [];

    // ===== Mine de métal =====
    // Coûts progressifs : métal + or (similaire à Mine d'or mais inversé)
    const mineMetalId = entityMap['Mine de métal'];
    if (mineMetalId) {
      console.log('\n📊 Génération des coûts pour Mine de métal...');
      for (let level = 1; level <= 50; level++) {
        // Coût en or (ressource principale pour construire une mine de métal)
        const goldCost = Math.floor(100 * Math.pow(1.18, level - 1));
        // Coût en métal (ressource secondaire)
        const metalCost = Math.floor(60 * Math.pow(1.18, level - 1));

        resourceCosts.push({
          entity_id: mineMetalId,
          resource_type: 'or',
          amount: goldCost,
          level: level
        });

        resourceCosts.push({
          entity_id: mineMetalId,
          resource_type: 'metal',
          amount: metalCost,
          level: level
        });

        if (level === 1 || level === 10 || level === 20 || level === 30 || level === 50) {
          console.log(`  Niveau ${level}: ${goldCost} or, ${metalCost} métal`);
        }
      }
    }

    // ===== Centrale électrique =====
    // Coûts : métal + or + carburant
    const centraleId = entityMap['Centrale électrique'];
    if (centraleId) {
      console.log('\n📊 Génération des coûts pour Centrale électrique...');
      for (let level = 1; level <= 50; level++) {
        const metalCost = Math.floor(150 * Math.pow(1.20, level - 1));
        const goldCost = Math.floor(100 * Math.pow(1.20, level - 1));
        const fuelCost = Math.floor(80 * Math.pow(1.20, level - 1));

        resourceCosts.push({
          entity_id: centraleId,
          resource_type: 'metal',
          amount: metalCost,
          level: level
        });

        resourceCosts.push({
          entity_id: centraleId,
          resource_type: 'or',
          amount: goldCost,
          level: level
        });

        resourceCosts.push({
          entity_id: centraleId,
          resource_type: 'carburant',
          amount: fuelCost,
          level: level
        });

        if (level === 1 || level === 10 || level === 20 || level === 30 || level === 50) {
          console.log(`  Niveau ${level}: ${metalCost} métal, ${goldCost} or, ${fuelCost} carburant`);
        }
      }
    }

    // ===== Réservoir =====
    // Coûts : métal + or (stockage carburant)
    const reservoirId = entityMap['Réservoir'];
    if (reservoirId) {
      console.log('\n📊 Génération des coûts pour Réservoir...');
      for (let level = 1; level <= 50; level++) {
        const metalCost = Math.floor(120 * Math.pow(1.19, level - 1));
        const goldCost = Math.floor(80 * Math.pow(1.19, level - 1));

        resourceCosts.push({
          entity_id: reservoirId,
          resource_type: 'metal',
          amount: metalCost,
          level: level
        });

        resourceCosts.push({
          entity_id: reservoirId,
          resource_type: 'or',
          amount: goldCost,
          level: level
        });

        if (level === 1 || level === 10 || level === 20 || level === 30 || level === 50) {
          console.log(`  Niveau ${level}: ${metalCost} métal, ${goldCost} or`);
        }
      }
    }

    // Insertion
    if (resourceCosts.length > 0) {
      await queryInterface.bulkInsert('resource_costs', resourceCosts);
      console.log(`\n✅ ${resourceCosts.length} entrées de coûts ajoutées avec succès!\n`);
    } else {
      console.log('\n⚠️ Aucun coût à ajouter.\n');
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('\n🔄 Suppression des coûts pour Mine de métal, Centrale électrique, Réservoir...\n');

    await queryInterface.sequelize.query(`
      DELETE FROM resource_costs 
      WHERE entity_id IN (
        SELECT entity_id FROM entities 
        WHERE entity_type = 'building' 
        AND entity_name IN ('Mine de métal', 'Centrale électrique', 'Réservoir')
      )
    `);

    console.log('✅ Coûts supprimés.\n');
  }
};
