#!/usr/bin/env node
/**
 * Seed test units to validate upkeep system
 * Creates units for System user to test calculations
 */

const { sequelize } = require('../db');
const { City, Unit } = require('../models');
const { runWithContext } = require('../utils/logger');

async function seedTestUnits() {
  console.log('\n🌱 Seeding test units for upkeep validation...\n');

  await runWithContext({ traceId: 'seed-test-units' }, async () => {
    try {
      // Find System user's first city
      const city = await City.findOne({
        where: { user_id: 1 },
        order: [['id', 'ASC']]
      });

      if (!city) {
        console.error('❌ No city found for System user (user_id=1)');
        console.log('   Create a city first or change user_id in script.');
        process.exit(1);
      }

      console.log(`✅ Found city: ${city.name} (ID: ${city.id})`);

      // Check existing units
      const existing = await Unit.findAll({ where: { city_id: city.id } });
      if (existing.length > 0) {
        console.log(`\n⚠️  City already has ${existing.length} unit types:`);
        existing.forEach(u => {
          console.log(`   - ${u.name}: ${u.quantity} units (force: ${u.force})`);
        });
        console.log('\n   Delete them? (y/n)');
        
        // For automation, we'll update instead of delete
        console.log('   → Updating existing units...\n');
      }

      // Create/update test army composition
      const testArmy = [
        // Tier 1 (cheap upkeep)
        { name: 'Militia', quantity: 100, force: 2 },
        { name: 'Infantry', quantity: 50, force: 4 },
        { name: 'Archer', quantity: 30, force: 5 },
        
        // Tier 2 (moderate upkeep)
        { name: 'Cavalry', quantity: 20, force: 8 },
        { name: 'Spearmen', quantity: 15, force: 6 },
        
        // Tier 3 (expensive upkeep)
        { name: 'Tanks', quantity: 10, force: 20 },
        { name: 'Aircraft', quantity: 5, force: 25 }
      ];

      console.log('📊 Creating test army composition:\n');
      
      for (const unitData of testArmy) {
        const [unit, created] = await Unit.findOrCreate({
          where: { city_id: city.id, name: unitData.name },
          defaults: unitData
        });

        if (!created) {
          // Update existing
          await unit.update({
            quantity: unitData.quantity,
            force: unitData.force
          });
        }

        console.log(`   ${created ? '✅ Created' : '🔄 Updated'}: ${unitData.quantity}x ${unitData.name} (force: ${unitData.force})`);
      }

      // Calculate expected upkeep
      console.log('\n💰 Expected hourly upkeep:\n');
      
      const upkeepRates = {
        'Militia': { gold: 1, metal: 0, fuel: 0 },
        'Infantry': { gold: 1, metal: 0, fuel: 0 },
        'Archer': { gold: 1, metal: 0, fuel: 0 },
        'Cavalry': { gold: 2, metal: 1, fuel: 1 },
        'Spearmen': { gold: 2, metal: 1, fuel: 0 },
        'Tanks': { gold: 8, metal: 4, fuel: 4 },
        'Aircraft': { gold: 10, metal: 3, fuel: 6 }
      };

      let totalGold = 0, totalMetal = 0, totalFuel = 0;

      testArmy.forEach(({ name, quantity }) => {
        const rates = upkeepRates[name];
        if (rates) {
          const gold = rates.gold * quantity;
          const metal = rates.metal * quantity;
          const fuel = rates.fuel * quantity;
          
          totalGold += gold;
          totalMetal += metal;
          totalFuel += fuel;

          console.log(`   ${name} (${quantity}x): ${gold}g, ${metal}m, ${fuel}f per hour`);
        }
      });

      console.log('\n   ─────────────────────────────────────');
      console.log(`   TOTAL: ${totalGold}g, ${totalMetal}m, ${totalFuel}f per hour`);
      console.log('   ─────────────────────────────────────\n');

      console.log('✅ Test units seeded successfully!\n');
      console.log('📝 Next steps:');
      console.log('   1. Run: node scripts/testUpkeep.js');
      console.log('   2. Verify upkeep calculations match expected totals');
      console.log('   3. Check resource affordability logic\n');

    } catch (error) {
      console.error('❌ Error seeding test units:', error);
      throw error;
    } finally {
      await sequelize.close();
    }
  });
}

// Run if called directly
if (require.main === module) {
  seedTestUnits().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedTestUnits };
