/**
 * Test du système de retour des troupes après combat
 */
const container = require('./container');
const sequelize = require('./db');

async function testAttackFlow() {
  console.log('\n🧪 TEST DU FLUX D\'ATTAQUE COMPLET\n');

  try {
    // Récupérer les services
    const combatService = container.resolve('combatService');
    const combatRepository = container.resolve('combatRepository');

    // Récupérer les villes de test
    const [cities] = await sequelize.query(`
      SELECT c.id, c.name, c.coord_x, c.coord_y, c.user_id, u.username
      FROM cities c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.id
      LIMIT 2
    `);

    if (cities.length < 2) {
      console.error('❌ Pas assez de villes pour le test');
      return;
    }

    const attacker = cities[0];
    const defender = cities[1];

    console.log(`📍 Attaquant: ${attacker.username} - ${attacker.name} (${attacker.coord_x},${attacker.coord_y})`);
    console.log(`📍 Défenseur: ${defender.username} - ${defender.name} (${defender.coord_x},${defender.coord_y})`);

    // Vérifier les unités disponibles
    const [attackerUnits] = await sequelize.query(`
      SELECT u.*, ut.name as type_name
      FROM units u
      JOIN unit_types ut ON u.unit_type_id = ut.id
      WHERE u.city_id = ? AND u.quantity > 0
      LIMIT 1
    `, { replacements: [attacker.id] });

    if (attackerUnits.length === 0) {
      console.error('❌ Pas d\'unités disponibles pour l\'attaquant');
      return;
    }

    const unit = attackerUnits[0];
    console.log(`\n💪 Unités disponibles: ${unit.quantity} ${unit.type_name}`);

    // Enregistrer l'état initial
    const initialQuantity = unit.quantity;
    const attackQuantity = Math.min(10, initialQuantity); // Envoyer 10 unités max

    console.log(`\n🚀 Lancement d'une attaque de test avec ${attackQuantity} ${unit.type_name}`);

    // Lancer l'attaque via le service
    const attackResult = await combatService.launchAttack(attacker.user_id, {
      fromCityId: attacker.id,
      toCityId: defender.id,
      attackType: 'raid',
      units: [{
        entityId: unit.id,
        quantity: attackQuantity
      }]
    });

    console.log(`✅ Attaque lancée avec succès (ID: ${attackResult.attackId})`);
    console.log(`   Arrivée prévue: ${attackResult.arrivalTime}`);

    // Vérifier que les unités ont été déduites
    const [updatedUnit] = await sequelize.query(`
      SELECT quantity FROM units WHERE id = ?
    `, { replacements: [unit.id] });

    const quantityAfterLaunch = updatedUnit[0].quantity;
    console.log(`\n📊 État après lancement:`);
    console.log(`   Avant: ${initialQuantity} unités`);
    console.log(`   Après: ${quantityAfterLaunch} unités`);
    console.log(`   Déduites: ${initialQuantity - quantityAfterLaunch} unités ✅`);

    if (initialQuantity - quantityAfterLaunch !== attackQuantity) {
      console.error(`❌ Erreur: ${attackQuantity} unités auraient dû être déduites`);
    }

    // Simuler l'arrivée et le combat (en appelant directement resolveCombat)
    console.log(`\n⚔️  Résolution du combat...`);
    
    const combatResult = await combatService.resolveCombat(attackResult.attackId);
    
    console.log(`\n🏆 Combat résolu:`);
    console.log(`   Vainqueur: ${combatResult.outcome}`);
    console.log(`   Butin: Or=${combatResult.loot?.gold || 0}, Metal=${combatResult.loot?.metal || 0}, Fuel=${combatResult.loot?.fuel || 0}`);

    // Vérifier le retour des troupes
    const [finalUnit] = await sequelize.query(`
      SELECT quantity FROM units WHERE id = ?
    `, { replacements: [unit.id] });

    const quantityAfterReturn = finalUnit[0].quantity;
    console.log(`\n📊 État après retour des troupes:`);
    console.log(`   Avant combat: ${quantityAfterLaunch} unités`);
    console.log(`   Après combat: ${quantityAfterReturn} unités`);
    
    // Récupérer les survivants de la BDD
    const [waves] = await sequelize.query(`
      SELECT survivors FROM attack_waves WHERE attack_id = ?
    `, { replacements: [attackResult.attackId] });

    const survivors = waves[0]?.survivors || 0;
    console.log(`   Survivantes: ${survivors} unités`);
    console.log(`   Pertes: ${attackQuantity - survivors} unités`);

    const expectedQuantity = quantityAfterLaunch + survivors;
    if (quantityAfterReturn === expectedQuantity) {
      console.log(`\n✅ TEST RÉUSSI: Les troupes sont revenues correctement!`);
      console.log(`   ${survivors}/${attackQuantity} unités ont été restituées`);
    } else {
      console.log(`\n❌ TEST ÉCHOUÉ: Problème de restitution des troupes`);
      console.log(`   Attendu: ${expectedQuantity}`);
      console.log(`   Reçu: ${quantityAfterReturn}`);
    }

    // Vérifier le statut de l'attaque
    const [attackStatus] = await sequelize.query(`
      SELECT status, outcome FROM attacks WHERE id = ?
    `, { replacements: [attackResult.attackId] });

    console.log(`\n📋 Statut final de l'attaque:`);
    console.log(`   Status: ${attackStatus[0].status}`);
    console.log(`   Outcome: ${attackStatus[0].outcome}`);

    if (attackStatus[0].status === 'completed') {
      console.log(`\n🎉 Le système fonctionne correctement!`);
    } else {
      console.log(`\n⚠️  Attention: l'attaque n'est pas marquée comme 'completed'`);
    }

  } catch (error) {
    console.error('\n❌ Erreur durant le test:', error);
    throw error;
  }
}

// Exécuter le test
(async () => {
  try {
    await testAttackFlow();
    process.exit(0);
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  }
})();
