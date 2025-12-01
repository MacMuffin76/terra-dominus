const sequelize = require('../db');

async function createConstructionQueueTable() {
  try {
    // Créer le type ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_construction_queue_status AS ENUM ('queued', 'in_progress', 'cancelled', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✓ Enum type created or already exists');

    // Créer la table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS construction_queue (
        id SERIAL PRIMARY KEY,
        city_id INTEGER NOT NULL,
        entity_id INTEGER NOT NULL,
        type VARCHAR(255) NOT NULL,
        status enum_construction_queue_status NOT NULL DEFAULT 'queued',
        start_time TIMESTAMP,
        finish_time TIMESTAMP,
        slot INTEGER NOT NULL
      );
    `);
    
    console.log('✓ Table construction_queue created');

    // Créer les index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_construction_queue_city_id ON construction_queue(city_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_construction_queue_status ON construction_queue(status);
    `);
    
    console.log('✓ Indexes created');
    console.log('\n✅ Construction queue table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating construction_queue table:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

createConstructionQueueTable();
