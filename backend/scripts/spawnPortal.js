/**
 * Manually spawn a portal for testing
 * Usage: node scripts/spawnPortal.js [tier]
 * Tiers: grey, green, blue, purple, red, golden
 */

require('dotenv').config();
const createContainer = require('../container');

async function spawnPortal() {
  const container = createContainer();
  const portalSpawnerService = container.resolve('portalSpawnerService');

  try {
    const tier = process.argv[2] || 'grey';
    const validTiers = ['grey', 'green', 'blue', 'purple', 'red', 'golden'];

    if (!validTiers.includes(tier)) {
      console.error(`❌ Invalid tier: ${tier}`);
      console.log(`Valid tiers: ${validTiers.join(', ')}`);
      process.exit(1);
    }

    console.log(`🌀 Spawning ${tier.toUpperCase()} portal...`);

    const portal = await portalSpawnerService.spawnPortal(tier);

    if (portal) {
      console.log('✅ Portal spawned successfully!');
      console.log(`   ID: #${portal.id}`);
      console.log(`   Tier: ${portal.tier.toUpperCase()}`);
      console.log(`   Coordinates: (${portal.x_coordinate}, ${portal.y_coordinate})`);
      console.log(`   Difficulty: ${portal.difficulty}/10`);
      console.log(`   Recommended Power: ${portal.recommended_power}`);
      console.log(`   Status: ${portal.status}`);
      console.log(`   Expires at: ${new Date(portal.expiry_time).toLocaleString()}`);
      console.log(`   Enemy Composition:`, JSON.stringify(portal.enemy_composition, null, 2));
    } else {
      console.log('⚠️  Portal spawn skipped (chance roll failed or max active reached)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error spawning portal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

spawnPortal();
