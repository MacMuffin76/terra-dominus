#!/usr/bin/env node
/**
 * Test Combat Counter System
 * Validates 1.5x bonus and 0.7x penalty mechanics
 */

const { runWithContext } = require('../utils/logger');
const { UNIT_DEFINITIONS, BALANCE_CONFIG } = require('../modules/combat/domain/unitDefinitions');

/**
 * Helper to calculate counter multiplier
 */
function calculateCounterMultiplier(attackerUnit, defenderUnit) {
  if (!attackerUnit || !defenderUnit) return 1.0;

  // Check if attacker counters defender (by ID, not category)
  if (attackerUnit.counters && attackerUnit.counters.includes(defenderUnit.id)) {
    return BALANCE_CONFIG.COUNTER_BONUS; // 1.5x
  }

  // Check if attacker is weak to defender (by ID or category)
  if (attackerUnit.weakTo && (attackerUnit.weakTo.includes(defenderUnit.id) || attackerUnit.weakTo.includes(defenderUnit.category))) {
    return BALANCE_CONFIG.WEAK_TO_PENALTY; // 0.7x
  }

  return 1.0; // Neutral
}

/**
 * Calculate army strength with simple counter logic
 */
function calculateStrength(army, enemyArmy) {
  let baseStrength = 0;
  let finalStrength = 0;
  const details = [];

  army.forEach(unit => {
    const unitDef = Object.values(UNIT_DEFINITIONS).find(u => u.name === unit.name);
    if (!unitDef) {
      console.warn(`Unit ${unit.name} not found in definitions`);
      return;
    }

    const unitBaseStrength = unitDef.attack * unit.quantity;
    baseStrength += unitBaseStrength;

    // Calculate counter multiplier against entire enemy army
    let totalMultiplier = 1.0;
    let counterCount = 0;
    let weakCount = 0;

    enemyArmy.forEach(enemyUnit => {
      const enemyDef = Object.values(UNIT_DEFINITIONS).find(u => u.name === enemyUnit.name);
      if (!enemyDef) return;

      const multiplier = calculateCounterMultiplier(unitDef, enemyDef);
      
      if (multiplier > 1.0) {
        counterCount++;
        totalMultiplier += (multiplier - 1.0) * (enemyUnit.quantity / enemyArmy.reduce((sum, u) => sum + u.quantity, 0));
      } else if (multiplier < 1.0) {
        weakCount++;
        totalMultiplier += (multiplier - 1.0) * (enemyUnit.quantity / enemyArmy.reduce((sum, u) => sum + u.quantity, 0));
      }
    });

    const unitFinalStrength = unitBaseStrength * totalMultiplier;
    finalStrength += unitFinalStrength;

    details.push({
      name: unit.name,
      quantity: unit.quantity,
      baseStrength: unitBaseStrength,
      multiplier: totalMultiplier,
      finalStrength: unitFinalStrength,
      counterCount,
      weakCount
    });
  });

  const avgMultiplier = finalStrength / baseStrength;

  return {
    baseStrength,
    finalStrength,
    counterModifier: avgMultiplier,
    details
  };
}

async function testCombatCounters() {
  console.log('\n⚔️  Testing Combat Counter System\n');
  console.log('═'.repeat(60));

  await runWithContext({ traceId: 'test-combat-counters' }, async () => {
    try {
      // Get all units from definitions (it's already an object with unit data)
      const allUnits = Object.values(UNIT_DEFINITIONS);

      console.log(`\n📊 Unit Database: ${allUnits.length} unit types loaded\n`);

      // Test Case 1: Equal armies, no counters
      console.log('═'.repeat(60));
      console.log('TEST 1: Equal Armies (No Counter Advantage)');
      console.log('═'.repeat(60));
      
      const army1 = [
        { name: 'Infantry', quantity: 100 }
      ];
      
      const army2 = [
        { name: 'Infantry', quantity: 100 }
      ];

      const result1 = calculateStrength(army1, army2);
      
      console.log('\n🔵 Army 1: 100 Infantry');
      console.log(`   Base Strength: ${result1.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result1.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result1.finalStrength.toFixed(0)}`);
      
      console.log('\n🔴 Army 2: 100 Infantry');
      console.log(`   Expected: Both armies equal strength`);
      console.log(`   Result: ${result1.counterModifier === 1.0 ? '✅ PASS' : '❌ FAIL'}`);

      // Test Case 2: Counter advantage (Spearmen vs Cavalry)
      console.log('\n═'.repeat(60));
      console.log('TEST 2: Counter Advantage (Spearmen vs Cavalry)');
      console.log('═'.repeat(60));
      
      const attackerSpearmen = [
        { name: 'Spearmen', quantity: 80 }
      ];
      
      const defenderCavalry = [
        { name: 'Cavalry', quantity: 100 }
      ];

      const result2Attacker = calculateStrength(attackerSpearmen, defenderCavalry);
      const result2Defender = calculateStrength(defenderCavalry, attackerSpearmen);
      
      console.log('\n🔵 Attacker: 80 Spearmen');
      console.log(`   Base Strength: ${result2Attacker.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result2Attacker.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result2Attacker.finalStrength.toFixed(0)}`);
      
      console.log('\n🔴 Defender: 100 Cavalry');
      console.log(`   Base Strength: ${result2Defender.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result2Defender.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result2Defender.finalStrength.toFixed(0)}`);
      
      console.log('\n📊 Analysis:');
      console.log(`   Spearmen counter Cavalry: ${result2Attacker.counterModifier >= 1.4 ? '✅ BONUS APPLIED' : '❌ NO BONUS'}`);
      console.log(`   Cavalry weak to Spearmen: ${result2Defender.counterModifier <= 0.8 ? '✅ PENALTY APPLIED' : '❌ NO PENALTY'}`);
      console.log(`   Power Shift: ${((result2Attacker.finalStrength / result2Defender.finalStrength - 1) * 100).toFixed(1)}%`);

      // Test Case 3: Anti-Tank vs Tanks
      console.log('\n═'.repeat(60));
      console.log('TEST 3: Hard Counter (Anti-Tank vs Tanks)');
      console.log('═'.repeat(60));
      
      const attackerAntiTank = [
        { name: 'Anti-Tank Infantry', quantity: 50 }
      ];
      
      const defenderTanks = [
        { name: 'Tanks', quantity: 50 }
      ];

      const result3Attacker = calculateStrength(attackerAntiTank, defenderTanks);
      const result3Defender = calculateStrength(defenderTanks, attackerAntiTank);
      
      console.log('\n🔵 Attacker: 50 Anti-Tank Infantry');
      console.log(`   Base Strength: ${result3Attacker.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result3Attacker.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result3Attacker.finalStrength.toFixed(0)}`);
      
      console.log('\n🔴 Defender: 50 Tanks');
      console.log(`   Base Strength: ${result3Defender.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result3Defender.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result3Defender.finalStrength.toFixed(0)}`);
      
      console.log('\n📊 Analysis:');
      const powerRatio = result3Attacker.finalStrength / result3Defender.finalStrength;
      console.log(`   Power Ratio: ${powerRatio.toFixed(2)}:1 in favor of Anti-Tank`);
      console.log(`   Expected Win Rate: ${powerRatio > 1.5 ? '✅ 70-80%' : '⚠️  Below target'}`);

      // Test Case 4: Mixed Army Composition
      console.log('\n═'.repeat(60));
      console.log('TEST 4: Mixed Army (Multiple Unit Types)');
      console.log('═'.repeat(60));
      
      const mixedArmy1 = [
        { name: 'Infantry', quantity: 50 },
        { name: 'Cavalry', quantity: 20 },
        { name: 'Archer', quantity: 30 }
      ];
      
      const mixedArmy2 = [
        { name: 'Spearmen', quantity: 40 },
        { name: 'Infantry', quantity: 40 },
        { name: 'Artillery', quantity: 10 }
      ];

      const result4Army1 = calculateStrength(mixedArmy1, mixedArmy2);
      const result4Army2 = calculateStrength(mixedArmy2, mixedArmy1);
      
      console.log('\n🔵 Army 1: 50 Infantry, 20 Cavalry, 30 Archer');
      console.log(`   Base Strength: ${result4Army1.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result4Army1.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result4Army1.finalStrength.toFixed(0)}`);
      
      console.log('\n🔴 Army 2: 40 Spearmen, 40 Infantry, 10 Artillery');
      console.log(`   Base Strength: ${result4Army2.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result4Army2.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result4Army2.finalStrength.toFixed(0)}`);
      
      console.log('\n📊 Analysis:');
      console.log(`   Army 2 Spearmen counter Army 1 Cavalry: Advantage`);
      console.log(`   Mixed composition reduces extreme swings: ${Math.abs(result4Army1.counterModifier - 1.0) < 0.3 ? '✅ BALANCED' : '⚠️  SKEWED'}`);

      // Test Case 5: Air vs Ground
      console.log('\n═'.repeat(60));
      console.log('TEST 5: Air Superiority (Aircraft vs Ground)');
      console.log('═'.repeat(60));
      
      const aircraftArmy = [
        { name: 'Fighter Aircraft', quantity: 20 }
      ];
      
      const groundArmy = [
        { name: 'Infantry', quantity: 100 },
        { name: 'Tanks', quantity: 10 }
      ];

      const result5Aircraft = calculateStrength(aircraftArmy, groundArmy);
      const result5Ground = calculateStrength(groundArmy, aircraftArmy);
      
      console.log('\n🔵 Attacker: 20 Fighter Aircraft');
      console.log(`   Base Strength: ${result5Aircraft.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result5Aircraft.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result5Aircraft.finalStrength.toFixed(0)}`);
      
      console.log('\n🔴 Defender: 100 Infantry + 10 Tanks');
      console.log(`   Base Strength: ${result5Ground.baseStrength.toFixed(0)}`);
      console.log(`   Counter Modifier: ${result5Ground.counterModifier.toFixed(2)}x`);
      console.log(`   Final Strength: ${result5Ground.finalStrength.toFixed(0)}`);
      
      console.log('\n📊 Analysis:');
      console.log(`   Aircraft advantage vs ground: ${result5Aircraft.counterModifier > 1.0 ? '✅ APPLIED' : '⚠️  MISSING'}`);
      console.log(`   Ground needs Anti-Air to counter: Recommendation`);

      // Summary
      console.log('\n═'.repeat(60));
      console.log('📝 COUNTER SYSTEM VALIDATION SUMMARY');
      console.log('═'.repeat(60));
      
      const tests = [
        { name: 'Equal armies neutral', pass: result1.counterModifier === 1.0 },
        { name: 'Spearmen counter Cavalry', pass: result2Attacker.counterModifier >= 1.4 },
        { name: 'Cavalry weak to Spearmen', pass: result2Defender.counterModifier <= 0.8 },
        { name: 'Anti-Tank dominates Tanks', pass: powerRatio > 1.5 },
        { name: 'Mixed armies balanced', pass: Math.abs(result4Army1.counterModifier - 1.0) < 0.3 }
      ];

      console.log('');
      tests.forEach(test => {
        console.log(`   ${test.pass ? '✅' : '❌'} ${test.name}`);
      });

      const passRate = tests.filter(t => t.pass).length / tests.length * 100;
      console.log(`\n   Overall: ${tests.filter(t => t.pass).length}/${tests.length} tests passed (${passRate.toFixed(0)}%)`);
      
      if (passRate >= 80) {
        console.log('\n   🎉 Counter system working as designed!');
      } else {
        console.log('\n   ⚠️  Counter system needs tuning');
      }

      console.log('\n═'.repeat(60));
      console.log('✅ Combat counter testing complete!\n');

    } catch (error) {
      console.error('❌ Error testing combat counters:', error);
      throw error;
    }
  });
}

// Run if called directly
if (require.main === module) {
  testCombatCounters()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { testCombatCounters };
