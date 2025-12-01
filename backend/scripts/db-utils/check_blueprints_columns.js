require('dotenv').config({ path: '.env.test' });
const { Sequelize } = require('sequelize');

async function checkColumns() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialectOptions: {
      ssl: false
    }
  });

  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'blueprints' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes de blueprints:');
    results.forEach(r => console.log('  -', r.column_name));
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkColumns();
