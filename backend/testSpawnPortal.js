/**
 * Test script pour spawner un portail manuellement
 * Usage: node backend/testSpawnPortal.js
 */

require('dotenv').config();
const createContainer = require('./container');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'test-portal' });

async function testSpawnPortal() {
  try {
    logger.info('Starting portal spawn test...');

    // Initialize container
    const container = createContainer();
    const portalService = container.resolve('portalService');

    // Spawn a random portal
    logger.info('Spawning random portal...');
    const portal = await portalService.spawnRandomPortal(1000);

    logger.info('Portal spawned successfully!', {
      id: portal.id,
      tier: portal.tier,
      coords: { x: portal.coord_x, y: portal.coord_y },
      power: portal.power,
      enemies: portal.enemies,
      loot_table: portal.loot_table,
      spawned_at: portal.spawned_at,
      expires_at: portal.expires_at
    });

    // Get portal statistics
    const stats = await portalService.getPortalStatistics();
    logger.info('Current portal statistics:', stats);

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    logger.error('Test failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

testSpawnPortal();
