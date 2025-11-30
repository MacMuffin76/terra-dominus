const sequelize = require('../db');

async function verifyUnits() {
  try {
    const [units] = await sequelize.query(`
      SELECT 
        e.entity_id, 
        e.entity_name, 
        us.unit_key, 
        us.tier, 
        us.attack, 
        us.defense, 
        us.health,
        us.speed,
        uu.gold_per_hour,
        uu.metal_per_hour,
        uu.fuel_per_hour
      FROM entities e
      JOIN unit_stats us ON e.entity_id = us.unit_id
      JOIN unit_upkeep uu ON e.entity_id = uu.unit_id
      WHERE e.entity_type = 'unit'
      ORDER BY us.tier, us.unit_key
    `);
    
    console.log('\n📊 Inserted Units:\n');
    console.table(units);
    
    const [costs] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM resource_costs 
      WHERE entity_id IN (SELECT entity_id FROM entities WHERE entity_type = 'unit')
    `);
    
    console.log(`\n💰 Resource Costs: ${costs[0].count} records`);
    
    const [counters] = await sequelize.query(`
      SELECT unit_key, counters, weak_to
      FROM unit_stats
      WHERE unit_key IN ('cavalry', 'spearmen', 'tanks')
    `);
    
    console.log('\n⚔️  Counter System Examples:\n');
    counters.forEach(u => {
      console.log(`${u.unit_key}:`);
      console.log(`  Counters: ${JSON.parse(u.counters).join(', ')}`);
      console.log(`  Weak to: ${JSON.parse(u.weak_to).join(', ')}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUnits();
