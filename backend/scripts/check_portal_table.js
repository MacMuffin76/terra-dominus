const sequelize = require('../db');

async function checkPortalTable() {
  try {
    const columns = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'portals' 
       ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Existing portals table columns:');
    console.log(JSON.stringify(columns, null, 2));
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkPortalTable();
