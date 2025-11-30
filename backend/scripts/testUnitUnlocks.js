const { User } = require('../models');
const { UNIT_TIERS, UNIT_DEFINITIONS } = require('../modules/combat/domain/unitDefinitions');

async function testUnitUnlocks() {
  try {
    console.log('\n🧪 Testing Unit Unlock System\n');
    console.log('='.repeat(60));

    // 1. Display all tiers
    console.log('\n📊 UNIT TIERS CONFIGURATION:\n');
    Object.entries(UNIT_TIERS).forEach(([key, tier], index) => {
      const tierNum = index + 1;
      const unitsInTier = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tierNum);
      console.log(`Tier ${tierNum}: ${tier.name}`);
      console.log(`  Unlock Level: ${tier.unlockLevel}`);
      console.log(`  Units: ${unitsInTier.length}`);
      console.log(`  ${unitsInTier.map(u => u.name).join(', ')}`);
      console.log('');
    });

    // 2. Find a test user
    const user = await User.findOne({
      order: [['id', 'ASC']]
    });

    if (!user) {
      console.log('❌ No user found. Create a user first.');
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log(`\n👤 Testing with user: ${user.username} (ID: ${user.id})`);
    console.log(`   Level: ${user.level || 1}`);
    console.log('');

    // 3. Calculate what's unlocked
    const userLevel = user.level || 1;
    const unlockedTiers = [];
    const lockedTiers = [];

    Object.entries(UNIT_TIERS).forEach(([key, tier], index) => {
      const tierNum = index + 1;
      if (userLevel >= tier.unlockLevel) {
        unlockedTiers.push(tierNum);
      } else {
        lockedTiers.push({ tier: tierNum, level: tier.unlockLevel, remaining: tier.unlockLevel - userLevel });
      }
    });

    console.log('🔓 UNLOCKED TIERS:');
    if (unlockedTiers.length > 0) {
      unlockedTiers.forEach(tier => {
        const tierInfo = Object.values(UNIT_TIERS)[tier - 1];
        const units = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tier);
        console.log(`  ✅ Tier ${tier}: ${tierInfo.name}`);
        console.log(`     Units available: ${units.length}`);
        units.forEach(unit => {
          console.log(`       - ${unit.name} (${unit.cost.gold}g ${unit.cost.metal}m ${unit.cost.fuel}f, ${unit.upkeepPerHour.gold}g/h upkeep)`);
        });
      });
    } else {
      console.log('  None (Level up to unlock units!)');
    }

    console.log('');
    console.log('🔒 LOCKED TIERS:');
    if (lockedTiers.length > 0) {
      lockedTiers.forEach(({ tier, level, remaining }) => {
        const tierInfo = Object.values(UNIT_TIERS)[tier - 1];
        const units = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tier);
        console.log(`  ❌ Tier ${tier}: ${tierInfo.name}`);
        console.log(`     Required Level: ${level} (${remaining} levels remaining)`);
        console.log(`     Units: ${units.map(u => u.name).join(', ')}`);
      });
    } else {
      console.log('  None (All tiers unlocked!)');
    }

    // 4. Show progression
    console.log('');
    console.log('📈 PROGRESSION:');
    const nextTier = lockedTiers[0];
    if (nextTier) {
      const progress = ((userLevel - (Object.values(UNIT_TIERS)[nextTier.tier - 2]?.unlockLevel || 0)) / 
                       (nextTier.level - (Object.values(UNIT_TIERS)[nextTier.tier - 2]?.unlockLevel || 0))) * 100;
      console.log(`  Current Tier: ${unlockedTiers.length > 0 ? Object.values(UNIT_TIERS)[unlockedTiers[unlockedTiers.length - 1] - 1].name : 'None'}`);
      console.log(`  Next Tier: ${Object.values(UNIT_TIERS)[nextTier.tier - 1].name}`);
      console.log(`  Progress: ${Math.round(progress)}%`);
      console.log(`  Levels to next unlock: ${nextTier.remaining}`);
    } else {
      console.log('  🎉 All tiers unlocked!');
    }

    // 5. Show unlock roadmap
    console.log('');
    console.log('🗺️  UNLOCK ROADMAP:');
    console.log('');
    Object.entries(UNIT_TIERS).forEach(([key, tier], index) => {
      const tierNum = index + 1;
      const isUnlocked = userLevel >= tier.unlockLevel;
      const symbol = isUnlocked ? '✅' : '🔒';
      const status = isUnlocked ? 'UNLOCKED' : `Level ${tier.unlockLevel}`;
      
      console.log(`  ${symbol} Tier ${tierNum}: ${tier.name.padEnd(20)} - ${status}`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('\n✅ Test complete!\n');
    
    // 6. API endpoint examples
    console.log('📡 API ENDPOINTS:');
    console.log('');
    console.log('  GET /api/v1/units/unlock/available');
    console.log('    → Get all units (unlocked + locked)');
    console.log('');
    console.log('  GET /api/v1/units/unlock/check/cavalry');
    console.log('    → Check if cavalry is unlocked');
    console.log('');
    console.log('  GET /api/v1/units/unlock/tiers');
    console.log('    → Get tiers summary with progression');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUnitUnlocks();
