const sequelize = require('../db');

async function cleanUnitData() {
  try {
    // Check and clean unit_stats
    const [stats] = await sequelize.query("SELECT COUNT(*) FROM unit_stats");
    if (stats[0].count > 0) {
      await sequelize.query('TRUNCATE TABLE unit_stats CASCADE');
      console.log('✅ Truncated unit_stats');
    }
    
    // Check and clean unit_upkeep if exists
    try {
      const [upkeep] = await sequelize.query("SELECT COUNT(*) FROM unit_upkeep");
      if (upkeep[0].count > 0) {
        await sequelize.query('TRUNCATE TABLE unit_upkeep CASCADE');
        console.log('✅ Truncated unit_upkeep');
      }
    } catch (e) {
      console.log('ℹ️  unit_upkeep table does not exist yet');
    }
    
    // Delete unit entities
    await sequelize.query("DELETE FROM entities WHERE entity_type = 'unit'");
    console.log('✅ Deleted unit entities');
    
    // Delete unit resource costs
    await sequelize.query("DELETE FROM resource_costs WHERE entity_id NOT IN (SELECT entity_id FROM entities)");
    console.log('✅ Deleted orphaned resource costs');
    
    console.log('\n🎉 Cleaned all existing unit data');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanUnitData();
