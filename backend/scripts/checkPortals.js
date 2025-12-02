/**
 * Check Portal System Status
 * Quick diagnostic script
 */

require('dotenv').config();
const sequelize = require('../db');

async function checkPortals() {
  // Initialize models
  const Portal = require('../models/Portal')(sequelize);
  await sequelize.sync();
  try {
    console.log('🔍 Checking portal system status...\n');

    // Count portals by status
    const activeCount = await Portal.count({ where: { status: 'active' } });
    const expiredCount = await Portal.count({ where: { status: 'expired' } });
    const completedCount = await Portal.count({ where: { status: 'completed' } });
    const totalCount = await Portal.count();

    console.log('📊 Portal Statistics:');
    console.log(`   Total portals: ${totalCount}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Expired: ${expiredCount}`);
    console.log(`   Completed: ${completedCount}\n`);

    // Count by tier
    const tiers = ['grey', 'green', 'blue', 'purple', 'red', 'golden'];
    console.log('🎯 Portals by Tier:');
    
    for (const tier of tiers) {
      const count = await Portal.count({ 
        where: { 
          tier,
          status: 'active'
        } 
      });
      console.log(`   ${tier}: ${count} active`);
    }

    // Get most recent portals
    console.log('\n📍 Recent Active Portals:');
    const recentPortals = await Portal.findAll({
      where: { status: 'active' },
      order: [['spawn_time', 'DESC']],
      limit: 5,
      attributes: ['id', 'tier', 'x_coordinate', 'y_coordinate', 'difficulty', 'recommended_power', 'spawn_time', 'expiry_time']
    });

    if (recentPortals.length === 0) {
      console.log('   ⚠️  No active portals found!');
      console.log('   💡 Portals should spawn every 2 hours via cron job.');
      console.log('   💡 Check logs: tail -f backend/logs/combined.log | grep portal');
    } else {
      recentPortals.forEach(p => {
        const expiresIn = Math.floor((new Date(p.expiry_time) - new Date()) / (1000 * 60 * 60));
        console.log(`   #${p.id} - ${p.tier.toUpperCase()} (${p.x_coordinate}, ${p.y_coordinate}) - Difficulty: ${p.difficulty} - Power: ${p.recommended_power} - Expires in: ${expiresIn}h`);
      });
    }

    console.log('\n✅ Portal check complete!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking portals:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkPortals();
