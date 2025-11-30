const sequelize = require('../db');
const { City, Unit, Resource, UnitUpkeep, Entity } = require('../models');

async function testUpkeep() {
  try {
    console.log('\n🧪 Testing Upkeep System\n');

    // 1. Find a city with units
    const citiesWithUnits = await City.findAll({
      include: [
        {
          model: Unit,
          as: 'units',
          where: { quantity: { [sequelize.Sequelize.Op.gt]: 0 } },
          required: true,
          include: [
            {
              model: Entity,
              as: 'entity',
              include: [
                {
                  model: UnitUpkeep,
                  as: 'unitUpkeep',
                  required: false
                }
              ]
            }
          ]
        }
      ],
      limit: 1
    });

    if (citiesWithUnits.length === 0) {
      console.log('❌ No cities with units found. Create some units first.');
      process.exit(1);
    }

    const city = citiesWithUnits[0];
    console.log(`📍 Testing with city: ${city.name} (ID: ${city.id})`);
    console.log(`   User ID: ${city.user_id}\n`);

    // 2. Calculate upkeep
    let totalGold = 0;
    let totalMetal = 0;
    let totalFuel = 0;

    console.log('🪖 Units and their upkeep:\n');
    city.units.forEach(unit => {
      const upkeep = unit.entity?.unitUpkeep;
      if (upkeep) {
        const goldCost = upkeep.gold_per_hour * unit.quantity;
        const metalCost = upkeep.metal_per_hour * unit.quantity;
        const fuelCost = upkeep.fuel_per_hour * unit.quantity;

        totalGold += goldCost;
        totalMetal += metalCost;
        totalFuel += fuelCost;

        console.log(`   ${unit.entity.entity_name}:`);
        console.log(`     Quantity: ${unit.quantity}`);
        console.log(`     Upkeep/unit: ${upkeep.gold_per_hour}g ${upkeep.metal_per_hour}m ${upkeep.fuel_per_hour}f`);
        console.log(`     Total: ${goldCost}g ${metalCost}m ${fuelCost}f/h`);
        console.log('');
      }
    });

    console.log(`💰 Total Upkeep: ${totalGold} gold, ${totalMetal} metal, ${totalFuel} fuel per hour\n`);

    // 3. Check current resources
    const resourceRecords = await Resource.findAll({
      where: { city_id: city.id }
    });

    if (!resourceRecords || resourceRecords.length === 0) {
      console.log('❌ No resources found for this city');
      process.exit(1);
    }

    // Convert array to object
    const resources = {};
    resourceRecords.forEach(r => {
      if (r.type === 'or') resources.gold = r.amount;
      else if (r.type === 'metal') resources.metal = r.amount;
      else if (r.type === 'carburant') resources.fuel = r.amount;
    });

    console.log('🏦 Current Resources:');
    console.log(`   Gold: ${resources.gold || 0}`);
    console.log(`   Metal: ${resources.metal || 0}`);
    console.log(`   Fuel: ${resources.fuel || 0}\n`);

    const canAfford = 
      (resources.gold || 0) >= totalGold &&
      (resources.metal || 0) >= totalMetal &&
      (resources.fuel || 0) >= totalFuel;

    if (canAfford) {
      console.log('✅ City CAN afford upkeep');
      const hoursCanSustain = Math.min(
        totalGold > 0 ? Math.floor(resources.gold / totalGold) : 999,
        totalMetal > 0 ? Math.floor(resources.metal / totalMetal) : 999,
        totalFuel > 0 ? Math.floor(resources.fuel / totalFuel) : 999
      );
      console.log(`   Can sustain for: ${hoursCanSustain} hours`);
    } else {
      console.log('❌ City CANNOT afford upkeep');
      console.log('   Shortfall:');
      if (resources.gold < totalGold) {
        console.log(`     Gold: need ${totalGold - resources.gold} more`);
      }
      if (resources.metal < totalMetal) {
        console.log(`     Metal: need ${totalMetal - resources.metal} more`);
      }
      if (resources.fuel < totalFuel) {
        console.log(`     Fuel: need ${totalFuel - resources.fuel} more`);
      }
      console.log('\n   ⚠️  10% of units would be disbanded each hour');
    }

    console.log('\n✅ Test complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUpkeep();
