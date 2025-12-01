const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

async function checkSchema() {
  try {
    // Check user_quests table
    const [userQuestsColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_quests' 
      ORDER BY ordinal_position
    `);
    console.log('\n=== user_quests columns ===');
    userQuestsColumns.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));

    // Check cities table
    const [citiesColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cities' 
      ORDER BY ordinal_position
    `);
    console.log('\n=== cities columns ===');
    citiesColumns.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));

    // Check enum for user_quests status
    const [enums] = await sequelize.query(`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'enum_user_quests_status'
    `);
    console.log('\n=== enum_user_quests_status values ===');
    enums.forEach(e => console.log(`  - ${e.enumlabel}`));

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
