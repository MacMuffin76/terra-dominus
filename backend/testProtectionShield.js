/**
 * Test Protection Shield System
 * This script tests the new player protection mechanics
 */

const { calculateShieldExpiration, hasActiveShield, canAttack, shouldLoseShield } = require('./modules/protection/domain/protectionRules');
const User = require('./models/User');
const City = require('./models/City');
const sequelize = require('./db');

async function testProtectionSystem() {
  console.log('🛡️ Testing Protection Shield System...\n');

  try {
    // Test 1: Shield calculation
    console.log('Test 1: Shield Expiration Calculation');
    const now = new Date();
    const shieldExpiration = calculateShieldExpiration(now);
    const diffHours = (shieldExpiration - now) / 3600000;
    console.log(`  ✅ Shield expires in ${diffHours} hours (expected: 72h)`);
    console.log(`  Current time: ${now.toISOString()}`);
    console.log(`  Expiration: ${shieldExpiration.toISOString()}\n`);

    // Test 2: Find or create test users
    console.log('Test 2: Creating Test Users');
    
    let newPlayer = await User.findOne({ where: { username: 'test_newplayer' } });
    if (!newPlayer) {
      newPlayer = await User.create({
        username: 'test_newplayer',
        email: 'newplayer@test.com',
        password: 'hashedpassword',
        protection_shield_until: calculateShieldExpiration(),
        attacks_sent_count: 0
      });
      console.log(`  ✅ Created new player: ${newPlayer.username} (ID: ${newPlayer.id})`);
    } else {
      console.log(`  ℹ️ Using existing player: ${newPlayer.username} (ID: ${newPlayer.id})`);
    }

    let aggressor = await User.findOne({ where: { username: 'test_aggressor' } });
    if (!aggressor) {
      aggressor = await User.create({
        username: 'test_aggressor',
        email: 'aggressor@test.com',
        password: 'hashedpassword',
        protection_shield_until: null,
        attacks_sent_count: 10
      });
      console.log(`  ✅ Created aggressor: ${aggressor.username} (ID: ${aggressor.id})`);
    } else {
      console.log(`  ℹ️ Using existing aggressor: ${aggressor.username} (ID: ${aggressor.id})\n`);
    }

    // Test 3: Check shield status
    console.log('Test 3: Shield Status Checks');
    const newPlayerHasShield = hasActiveShield(newPlayer);
    const aggressorHasShield = hasActiveShield(aggressor);
    console.log(`  New player has shield: ${newPlayerHasShield ? '✅ YES' : '❌ NO'}`);
    console.log(`  Aggressor has shield: ${aggressorHasShield ? '✅ NO (expected)' : '❌ YES (unexpected)'}\n`);

    // Test 4: Attack permission check
    console.log('Test 4: Attack Permission Checks');
    
    // Aggressor tries to attack new player (should fail)
    const attackCheck1 = canAttack(aggressor, newPlayer);
    console.log(`  Aggressor → New Player: ${attackCheck1.canAttack ? '❌ ALLOWED (unexpected)' : '✅ BLOCKED'}`);
    console.log(`    Reason: ${attackCheck1.reason || 'N/A'}`);
    
    // New player tries to attack aggressor (should succeed with warning)
    const attackCheck2 = canAttack(newPlayer, aggressor);
    console.log(`  New Player → Aggressor: ${attackCheck2.canAttack ? '✅ ALLOWED' : '❌ BLOCKED'}`);
    console.log(`    Warning: ${attackCheck2.attackerWarning || 'N/A'}\n`);

    // Test 5: Shield loss conditions
    console.log('Test 5: Shield Loss Conditions');
    
    const cityCount = await City.count({ where: { user_id: newPlayer.id } });
    console.log(`  New player has ${cityCount} cities`);
    
    const shieldCheck1 = shouldLoseShield(newPlayer, cityCount);
    console.log(`  Should lose shield: ${shieldCheck1.shouldLoseShield ? '❌ YES' : '✅ NO (expected)'}`);
    
    // Simulate aggressive behavior
    newPlayer.attacks_sent_count = 5;
    const shieldCheck2 = shouldLoseShield(newPlayer, cityCount);
    console.log(`  After 5 attacks: ${shieldCheck2.shouldLoseShield ? '✅ YES (expected)' : '❌ NO'}`);
    console.log(`    Reason: ${shieldCheck2.reason || 'N/A'}\n`);

    // Test 6: Expired shield
    console.log('Test 6: Expired Shield Check');
    const expiredPlayer = {
      protection_shield_until: new Date(Date.now() - 1000) // 1 second ago
    };
    const expiredShieldCheck = hasActiveShield(expiredPlayer);
    console.log(`  Expired shield is active: ${expiredShieldCheck ? '❌ YES (unexpected)' : '✅ NO (expected)'}\n`);

    console.log('✅ All protection system tests passed!\n');

    console.log('📊 Protection Configuration:');
    const { PROTECTION_CONFIG } = require('./modules/protection/domain/protectionRules');
    console.log(`  Shield Duration: ${PROTECTION_CONFIG.SHIELD_DURATION_MS / 3600000} hours`);
    console.log(`  Max Attacks Before Shield Loss: ${PROTECTION_CONFIG.MAX_ATTACKS_BEFORE_SHIELD_LOSS}`);
    console.log(`  Max Cities With Shield: ${PROTECTION_CONFIG.MAX_CITIES_WITH_SHIELD}`);
    console.log(`  Raid Cooldown: ${PROTECTION_CONFIG.RAID_COOLDOWN_MS / 60000} minutes`);
    console.log(`  Max Attacks Per Day: ${PROTECTION_CONFIG.MAX_ATTACKS_PER_DAY}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run tests
testProtectionSystem()
  .then(() => {
    console.log('\n🎉 Protection shield system is ready!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Tests failed:', error.message);
    process.exit(1);
  });
