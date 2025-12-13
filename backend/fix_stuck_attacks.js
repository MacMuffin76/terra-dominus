/**
 * Script pour traiter manuellement les attaques bloquées en status "arrived"
 * et restituer les troupes survivantes à l'attaquant
 */
const sequelize = require('./db');

async function processStuckAttacks() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('\n🔧 TRAITEMENT DES ATTAQUES BLOQUEES\n');

    // Trouver les attaques en status "arrived"
    const [arrivedAttacks] = await sequelize.query(`
      SELECT 
        a.*,
        c1.coord_x as attacker_x, c1.coord_y as attacker_y, c1.name as attacker_city_name,
        c2.coord_x as defender_x, c2.coord_y as defender_y, c2.name as defender_city_name,
        u1.username as attacker_name
      FROM attacks a
      LEFT JOIN cities c1 ON a.attacker_city_id = c1.id
      LEFT JOIN cities c2 ON a.defender_city_id = c2.id
      LEFT JOIN users u1 ON a.attacker_user_id = u1.id
      WHERE a.status = 'arrived'
      ORDER BY a.id
    `, { transaction });

    if (arrivedAttacks.length === 0) {
      console.log('✅ Aucune attaque bloquée trouvée');
      await transaction.rollback();
      return;
    }

    console.log(`📊 ${arrivedAttacks.length} attaque(s) bloquée(s) trouvée(s)\n`);

    for (const attack of arrivedAttacks) {
      console.log(`\n🎯 Traitement attaque ID: ${attack.id}`);
      console.log(`   ${attack.attacker_name}: ${attack.attacker_city_name} (${attack.attacker_x},${attack.attacker_y}) -> ${attack.defender_city_name} (${attack.defender_x},${attack.defender_y})`);
      
      // Récupérer les waves
      const [waves] = await sequelize.query(`
        SELECT aw.*, u.name as unit_name
        FROM attack_waves aw
        LEFT JOIN units u ON aw.unit_entity_id = u.id
        WHERE aw.attack_id = ?
      `, { 
        replacements: [attack.id],
        transaction 
      });

      console.log(`   📦 ${waves.length} type(s) d'unités envoyées`);

      // Pour chaque wave, restituer les unités
      for (const wave of waves) {
        // Si survivors est NULL, on considère que toutes les unités ont survécu
        // (le combat n'a jamais été résolu)
        const survivors = wave.survivors !== null ? wave.survivors : wave.quantity;
        
        console.log(`   ↩️  Restitution: ${wave.unit_name} - ${survivors}/${wave.quantity} survivantes`);

        // Mettre à jour la quantité d'unités dans la ville
        await sequelize.query(`
          UPDATE units 
          SET quantity = quantity + ?
          WHERE id = ?
        `, {
          replacements: [survivors, wave.unit_entity_id],
          transaction
        });

        // Marquer le nombre de survivants dans la wave
        if (wave.survivors === null) {
          await sequelize.query(`
            UPDATE attack_waves 
            SET survivors = ?
            WHERE id = ?
          `, {
            replacements: [survivors, wave.id],
            transaction
          });
        }
      }

      // Mettre à jour le statut de l'attaque
      await sequelize.query(`
        UPDATE attacks 
        SET status = 'completed',
            outcome = COALESCE(outcome, 'attacker_victory')
        WHERE id = ?
      `, {
        replacements: [attack.id],
        transaction
      });

      console.log(`   ✅ Attaque ${attack.id} traitée et marquée comme 'completed'`);
    }

    await transaction.commit();
    console.log(`\n✅ ${arrivedAttacks.length} attaque(s) traitée(s) avec succès\n`);

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter le script
(async () => {
  try {
    await processStuckAttacks();
    process.exit(0);
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  }
})();
