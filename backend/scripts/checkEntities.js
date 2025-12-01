const db = require('../db');
const Entity = require('../models/Entity');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'CheckEntities' });

async function checkEntities() {
  try {
    await db.authenticate();
    logger.info('Database connected');

    const entities = await Entity.findAll({
      where: { entity_type: 'building' },
      attributes: ['entity_id', 'entity_name'],
    });

    console.log('\n=== BUILDING ENTITIES ===');
    entities.forEach(e => {
      console.log(`ID: ${e.entity_id} | Name: "${e.entity_name}"`);
    });

    console.log('\n=== REQUIRED RESOURCE BUILDINGS ===');
    const required = [
      "Mine d'or",
      'Mine de métal',
      'Extracteur',
      'Centrale électrique',
      'Hangar',
      'Réservoir',
    ];

    const entityNames = entities.map(e => e.entity_name);
    required.forEach(name => {
      const exists = entityNames.includes(name);
      console.log(`${exists ? '✓' : '✗'} ${name}`);
    });

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Check failed');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEntities();
