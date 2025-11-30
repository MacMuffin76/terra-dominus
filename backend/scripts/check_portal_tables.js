const sequelize = require('../db');

async function checkTables() {
  try {
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name LIKE 'portal%'
       ORDER BY table_name`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Portal-related tables:');
    console.log(JSON.stringify(tables, null, 2));
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkTables();
