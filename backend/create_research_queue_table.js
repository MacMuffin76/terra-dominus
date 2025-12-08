const sequelize = require('./db');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'MigrationResearchQueue' });

async function createResearchQueueTable() {
  try {
    logger.info('Creating research_queue table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS research_queue (
        id SERIAL PRIMARY KEY,
        city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        research_id INTEGER NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'cancelled', 'completed')),
        start_time TIMESTAMP,
        finish_time TIMESTAMP,
        slot INTEGER NOT NULL,
        CONSTRAINT unique_city_slot UNIQUE (city_id, slot)
      );
    `);

    logger.info('Creating indexes...');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_research_queue_city_status ON research_queue(city_id, status);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_research_queue_slot ON research_queue(city_id, slot);
    `);

    logger.info('Research queue table created successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error creating research_queue table');
    process.exit(1);
  }
}

createResearchQueueTable();
