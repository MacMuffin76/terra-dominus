const sequelize = require('./db');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'CheckResourceTypes' });

async function checkResourceTypes() {
  try {
    const [results] = await sequelize.query(`
      SELECT DISTINCT type FROM resources ORDER BY type;
    `);

    logger.info({ types: results }, 'Resource types in database');
    console.log('Resource types found:');
    results.forEach(r => console.log(`  - ${r.type}`));
    
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error checking resource types');
    process.exit(1);
  }
}

checkResourceTypes();
