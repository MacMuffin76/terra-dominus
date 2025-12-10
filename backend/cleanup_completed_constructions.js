const sequelize = require('./db');

async function cleanupCompletedConstructions() {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM construction_queue 
      WHERE status = 'completed' 
      AND finish_time < NOW() - INTERVAL '1 hour'
      RETURNING id;
    `);

    console.log(`Cleaned up ${result.length} old completed constructions`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupCompletedConstructions();
