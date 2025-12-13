/**
 * Test de scénarios de combat avec défenses
 */
const sequelize = require('./db');

async function testDefenseScenarios() {
  console.log('\n🛡️  TEST DES SCENARIOS DE DEFENSE\n');

  try {
    // 1. Vérifier les villes disponibles
    const [cities] = await sequelize.query(`
      SELECT c.id, c.name, c.coord_x, c.coord_y, c.user_id, u.username
      FROM cities c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.id
      LIMIT 2
    `);

    if (cities.length < 2) {
      console.error('❌ Pas assez de villes');
      return;
    }

    const defender = cities[1]; // Ville défenseuse

    console.log(`🏰 Analyse de la ville défenseuse: ${defender.name} (${defender.coord_x},${defender.coord_y})`);
    console.log(`   Propriétaire: ${defender.username}\n`);

    // 2. Vérifier les unités de défense
    const [defenderUnits] = await sequelize.query(`
      SELECT 
        u.id, 
        u.quantity, 
        u.name as unit_name,
        u.force
      FROM units u
      WHERE u.city_id = ?
      ORDER BY u.quantity DESC
    `, { replacements: [defender.id] });

    console.log(`👥 Forces défensives actuelles:`);
    if (defenderUnits.length === 0) {
      console.log(`   ⚠️  AUCUNE UNITÉ DE DÉFENSE!`);
      console.log(`   → Si une attaque arrive, la ville sera sans défense\n`);
    } else {
      let totalDefensePower = 0;
      defenderUnits.forEach(unit => {
        if (unit.quantity > 0) {
          const unitDefense = (unit.force || 10) * unit.quantity;
          totalDefensePower += unitDefense;
          console.log(`   - ${unit.quantity}x ${unit.unit_name}`);
          console.log(`     Force: ${unit.force || 10}`);
          console.log(`     Force défensive totale: ${unitDefense}`);
        }
      });
      console.log(`\n   💪 FORCE DEFENSIVE TOTALE: ${totalDefensePower}\n`);
    }

    // 3. Vérifier les structures défensives
    const [walls] = await sequelize.query(`
      SELECT b.level, e.name
      FROM buildings b
      JOIN entities e ON b.entity_id = e.id
      WHERE b.city_id = ? AND e.name = 'Murailles'
    `, { replacements: [defender.id] });

    if (walls.length > 0 && walls[0].level > 0) {
      const wallsBonus = walls[0].level * 0.08; // 8% par niveau
      console.log(`🏰 Murailles défensives:`);
      console.log(`   Niveau: ${walls[0].level}`);
      console.log(`   Bonus de défense: +${(wallsBonus * 100).toFixed(0)}%`);
      console.log(`   → Multiplie la force défensive par ${(1 + wallsBonus).toFixed(2)}\n`);
    } else {
      console.log(`⚠️  Pas de murailles construites`);
      console.log(`   → Construire des Murailles donne un bonus défensif important!\n`);
    }

    // 4. Vérifier les recherches défensives
    const [defenseResearches] = await sequelize.query(`
      SELECT r.level, e.name
      FROM researches r
      JOIN entities e ON r.entity_id = e.id
      WHERE r.user_id = ? 
        AND (e.name LIKE '%Défens%' OR e.name LIKE '%Fortif%')
        AND r.level > 0
    `, { replacements: [defender.user_id] });

    if (defenseResearches.length > 0) {
      console.log(`🔬 Recherches défensives:`);
      let totalTechBonus = 0;
      defenseResearches.forEach(research => {
        const bonus = research.level * 0.10;
        totalTechBonus += bonus;
        console.log(`   - ${research.name} Niv ${research.level}: +${(bonus * 100).toFixed(0)}%`);
      });
      console.log(`   💡 BONUS TECH TOTAL: +${(totalTechBonus * 100).toFixed(0)}%\n`);
    } else {
      console.log(`⚠️  Aucune recherche défensive`);
      console.log(`   → Rechercher "Tactiques Défensives" ou "Fortifications"\n`);
    }

    // 5. Simulation d'un scénario d'attaque
    console.log(`\n⚔️  SIMULATION DE COMBAT\n`);
    
    const attacker = cities[0];
    const [attackerUnits] = await sequelize.query(`
      SELECT u.quantity, u.name, u.force
      FROM units u
      WHERE u.city_id = ? AND u.quantity > 0
      LIMIT 1
    `, { replacements: [attacker.id] });

    if (attackerUnits.length > 0 && defenderUnits.length > 0) {
      const attackUnit = attackerUnits[0];
      const attackQuantity = Math.min(50, attackUnit.quantity);
      const attackPower = (attackUnit.force || 10) * attackQuantity;

      console.log(`📊 Scénario: ${attacker.username} attaque avec ${attackQuantity}x ${attackUnit.name}`);
      console.log(`   Force d'attaque: ${attackPower}`);
      
      // Calculer la défense avec bonus
      let defensePower = 0;
      defenderUnits.forEach(unit => {
        if (unit.quantity > 0) {
          defensePower += (unit.force || 10) * unit.quantity;
        }
      });

      let finalDefensePower = defensePower;
      let multiplier = 1.0;

      // Bonus murailles
      if (walls.length > 0 && walls[0].level > 0) {
        const wallsBonus = walls[0].level * 0.08;
        multiplier *= (1 + wallsBonus);
      }

      // Bonus tech
      if (defenseResearches.length > 0) {
        let techBonus = 0;
        defenseResearches.forEach(r => {
          techBonus += r.level * 0.10;
        });
        multiplier *= (1 + techBonus);
      }

      finalDefensePower = defensePower * multiplier;

      console.log(`\n   Force défensive de base: ${defensePower}`);
      console.log(`   Multiplicateur (murailles + tech): x${multiplier.toFixed(2)}`);
      console.log(`   Force défensive finale: ${Math.floor(finalDefensePower)}`);

      console.log(`\n   Ratio attaque/défense: ${(attackPower / finalDefensePower).toFixed(2)}`);

      if (attackPower > finalDefensePower * 1.5) {
        console.log(`\n   ✅ Victoire probable de l'attaquant`);
        console.log(`   → L'attaquant a une force écrasante`);
      } else if (attackPower > finalDefensePower) {
        console.log(`\n   ⚖️  Victoire probable de l'attaquant mais avec pertes`);
        console.log(`   → Combat équilibré`);
      } else if (finalDefensePower > attackPower * 1.5) {
        console.log(`\n   🛡️  Victoire probable du défenseur`);
        console.log(`   → Les défenses repoussent l'attaque`);
      } else {
        console.log(`\n   ⚖️  Combat incertain`);
        console.log(`   → Les deux camps subiront des pertes importantes`);
      }

      // Estimation des pertes
      const combatRounds = Math.min(10, Math.ceil(Math.max(attackPower, finalDefensePower) / 100));
      const attackerLossRate = Math.min(0.8, (finalDefensePower / attackPower) * 0.3 * combatRounds);
      const defenderLossRate = Math.min(0.8, (attackPower / finalDefensePower) * 0.3 * combatRounds);

      console.log(`\n   📉 Estimation des pertes:`);
      console.log(`      Attaquant: ~${Math.floor(attackQuantity * attackerLossRate)}/${attackQuantity} unités perdues`);
      
      let totalDefenderUnits = 0;
      defenderUnits.forEach(u => { totalDefenderUnits += u.quantity; });
      console.log(`      Défenseur: ~${Math.floor(totalDefenderUnits * defenderLossRate)}/${totalDefenderUnits} unités perdues`);
    }

    console.log(`\n\n📚 COMMENT FONCTIONNE LA DÉFENSE:\n`);
    console.log(`1. 🏰 MURAILLES:`);
    console.log(`   - Bonus: +8% de défense par niveau`);
    console.log(`   - Max: +200% au niveau 25`);
    console.log(`   - Les murailles multiplient la force de TOUTES vos unités défensives\n`);

    console.log(`2. 👥 UNITÉS DE DÉFENSE:`);
    console.log(`   - Les unités restées dans la ville défendent automatiquement`);
    console.log(`   - Utilisent leur stat "defense_power" en combat défensif`);
    console.log(`   - Système de counters: certaines unités sont fortes contre d'autres\n`);

    console.log(`3. 🔬 RECHERCHES:`);
    console.log(`   - "Tactiques Défensives": +10% par niveau`);
    console.log(`   - "Fortifications": +10% par niveau`);
    console.log(`   - Les bonus se cumulent avec les murailles\n`);

    console.log(`4. ⚔️  CALCUL DU COMBAT:`);
    console.log(`   Force Attaque = Σ(unités_attaquantes × attack_power) × bonus_tech_attaquant`);
    console.log(`   Force Défense = Σ(unités_défense × defense_power) × (1 + bonus_murailles) × (1 + bonus_tech_défenseur)`);
    console.log(`   → Combat simulé sur plusieurs rounds jusqu'à victoire d'un camp\n`);

    console.log(`5. 💀 PERTES:`);
    console.log(`   - Les deux camps subissent des pertes proportionnelles`);
    console.log(`   - Les unités survivantes de l'attaquant retournent à leur ville`);
    console.log(`   - Les unités survivantes du défenseur restent en place\n`);

    console.log(`6. 💰 BUTIN (si victoire attaquant):`);
    console.log(`   - Raid: 20% des ressources`);
    console.log(`   - Conquest: 40% des ressources`);
    console.log(`   - Siege: 10% des ressources\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
(async () => {
  await testDefenseScenarios();
})();
