const sequelize = require('./db');

(async () => {
  try {
    console.log('\n=== VERIFICATION DES ATTAQUES ===\n');

    // Récupérer les attaques récentes
    const [attacks] = await sequelize.query(`
      SELECT 
        a.*,
        c1.coord_x as attacker_x, c1.coord_y as attacker_y, c1.name as attacker_city_name,
        c2.coord_x as defender_x, c2.coord_y as defender_y, c2.name as defender_city_name,
        u1.username as attacker_name,
        u2.username as defender_name
      FROM attacks a
      LEFT JOIN cities c1 ON a.attacker_city_id = c1.id
      LEFT JOIN cities c2 ON a.defender_city_id = c2.id
      LEFT JOIN users u1 ON a.attacker_user_id = u1.id
      LEFT JOIN users u2 ON a.defender_user_id = u2.id
      WHERE c1.coord_x = 1 AND c1.coord_y = 1 
        AND c2.coord_x = 2 AND c2.coord_y = 2
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    if (attacks.length === 0) {
      console.log('❌ Aucune attaque trouvée entre (1,1) et (2,2)');
      process.exit(0);
    }

    for (const attack of attacks) {
      console.log(`\n📊 Attaque ID: ${attack.id}`);
      console.log(`   Attaquant: ${attack.attacker_name} - Ville: ${attack.attacker_city_name} (${attack.attacker_x},${attack.attacker_y})`);
      console.log(`   Défenseur: ${attack.defender_name} - Ville: ${attack.defender_city_name} (${attack.defender_x},${attack.defender_y})`);
      console.log(`   Type: ${attack.attack_type}`);
      console.log(`   Status: ${attack.status}`);
      console.log(`   Départ: ${attack.departure_time}`);
      console.log(`   Arrivée: ${attack.arrival_time}`);
      console.log(`   Distance: ${attack.distance}`);
      console.log(`   Outcome: ${attack.outcome || 'N/A'}`);
      console.log(`   Butin - Or: ${attack.loot_gold}, Metal: ${attack.loot_metal}, Carburant: ${attack.loot_fuel}`);

      // Récupérer les waves (unités envoyées)
      const [waves] = await sequelize.query(`
        SELECT aw.*, u.name as unit_name, u.quantity as current_quantity
        FROM attack_waves aw
        LEFT JOIN units u ON aw.unit_entity_id = u.id
        WHERE aw.attack_id = ${attack.id}
      `);

      console.log(`\n   🎯 Unités envoyées:`);
      for (const wave of waves) {
        console.log(`      - ${wave.unit_name || 'Unknown'} (ID: ${wave.unit_entity_id})`);
        console.log(`        Envoyées: ${wave.quantity}`);
        console.log(`        Survivantes: ${wave.survivors !== null ? wave.survivors : 'N/A'}`);
        console.log(`        Quantité actuelle dans la ville: ${wave.current_quantity || 0}`);
      }
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();
