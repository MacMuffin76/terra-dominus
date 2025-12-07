/**
 * Check user_quests table schema
 */
const { sequelize } = require('./models');

async function checkSchema() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'user_quests'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 user_quests table schema:\n');
    results.forEach(col => {
      console.log(`  ${col.column_name}`);
      console.log(`    Type: ${col.data_type}`);
      console.log(`    Nullable: ${col.is_nullable}`);
      console.log(`    Default: ${col.column_default || 'none'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
