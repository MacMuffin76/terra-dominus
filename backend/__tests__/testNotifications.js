/**
 * Test script for real-time Socket.IO notifications
 * Tests that notifications are sent correctly when events occur
 */

const { sequelize, User } = require('./models');
const NotificationService = require('./utils/notificationService');
const battlePassService = require('./modules/battlepass/application/BattlePassService');
const achievementChecker = require('./utils/achievementChecker');

async function testNotifications() {
  try {
    console.log('\n=== Socket.IO Notifications Test ===\n');
    console.log('⚠️  Note: This test checks that notification methods can be called successfully.');
    console.log('    To see actual Socket.IO events, you need a connected client.\n');

    // Find test user
    const testUser = await User.findOne({ where: { username: 'testuser_xp' } });
    if (!testUser) {
      console.log('❌ Test user not found. Run testBattlePassXP.js first to create test users.');
      await sequelize.close();
      return;
    }

    console.log(`✓ Testing with user: ${testUser.username} (ID: ${testUser.id})\n`);

    // Test 1: Achievement notification
    console.log('--- Test 1: Achievement Notification ---');
    try {
      const mockAchievement = {
        id: 1,
        name: 'Test Achievement',
        description: 'This is a test achievement',
        icon_url: 'trophy.png'
      };

      NotificationService.notifyAchievementUnlocked(testUser.id, mockAchievement);
      console.log('✅ Achievement notification sent (if Socket.IO connected)');
    } catch (error) {
      console.log('❌ Achievement notification failed:', error.message);
    }

    // Test 2: Leaderboard rank change notification
    console.log('\n--- Test 2: Leaderboard Rank Change ---');
    try {
      NotificationService.notifyLeaderboardRankChanged(
        testUser.id,
        'total_power',
        25,  // old rank
        20   // new rank (improved by 5)
      );
      console.log('✅ Leaderboard rank change notification sent');
    } catch (error) {
      console.log('❌ Leaderboard notification failed:', error.message);
    }

    // Test 3: Leaderboard top entry notification
    console.log('\n--- Test 3: Leaderboard Top 10 Entry ---');
    try {
      NotificationService.notifyLeaderboardTopEntry(
        testUser.id,
        'combat_victories',
        3  // rank 3 (bronze medal)
      );
      console.log('✅ Top 10 entry notification sent');
    } catch (error) {
      console.log('❌ Top 10 notification failed:', error.message);
    }

    // Test 4: Battle Pass tier up notification
    console.log('\n--- Test 4: Battle Pass Tier Up ---');
    try {
      NotificationService.notifyBattlePassTierUp(
        testUser.id,
        5,    // new tier
        250   // current XP
      );
      console.log('✅ Battle Pass tier up notification sent');
    } catch (error) {
      console.log('❌ Battle Pass notification failed:', error.message);
    }

    // Test 5: Battle Pass rewards available
    console.log('\n--- Test 5: Battle Pass Rewards Available ---');
    try {
      NotificationService.notifyBattlePassRewardsAvailable(
        testUser.id,
        3  // 3 rewards available
      );
      console.log('✅ Rewards available notification sent');
    } catch (error) {
      console.log('❌ Rewards notification failed:', error.message);
    }

    // Test 6: Actually add XP to trigger real notification
    console.log('\n--- Test 6: Real Battle Pass XP Addition ---');
    try {
      const result = await battlePassService.addXP(testUser.id, 100, 'test');
      console.log('✅ XP added:', {
        xpAdded: result.xpAdded,
        newTier: result.newTier,
        tiersGained: result.tiersGained
      });

      if (result.tiersGained > 0) {
        console.log('   🎉 Tier up notification should have been sent!');
      } else {
        console.log('   ℹ️  No tier up (need more XP for notification)');
      }
    } catch (error) {
      console.log('❌ XP addition failed:', error.message);
    }

    // Test 7: Actually check combat achievements to trigger notification
    console.log('\n--- Test 7: Real Achievement Check ---');
    try {
      const combatResult = {
        outcome: 'attacker_victory',
        defenderLosses: { infantry: 3 }
      };

      const unlocked = await achievementChecker.checkCombatAchievements(
        testUser.id,
        combatResult
      );

      if (unlocked.length > 0) {
        console.log(`✅ ${unlocked.length} achievement(s) unlocked - notifications sent!`);
        unlocked.forEach(u => {
          console.log(`   🏆 ${u.achievement.title}`);
        });
      } else {
        console.log('   ℹ️  No new achievements unlocked (already completed)');
      }
    } catch (error) {
      console.log('❌ Achievement check failed:', error.message);
    }

    // Test 8: Combat result notification
    console.log('\n--- Test 8: Combat Result Notification ---');
    try {
      NotificationService.notifyCombatResult(
        testUser.id,
        'victory',
        {
          enemyName: 'Test Enemy',
          loot: { gold: 500, metal: 200 }
        }
      );
      console.log('✅ Combat result notification sent');
    } catch (error) {
      console.log('❌ Combat notification failed:', error.message);
    }

    // Test 9: Broadcast notification
    console.log('\n--- Test 9: Broadcast Notification (All Users) ---');
    try {
      NotificationService.sendBroadcast(
        'server_maintenance',
        {
          title: '🛠️ Server Maintenance',
          message: 'Scheduled maintenance in 10 minutes',
          icon: 'warning'
        },
        NotificationService.PRIORITIES.HIGH
      );
      console.log('✅ Broadcast notification sent to all connected users');
    } catch (error) {
      console.log('❌ Broadcast failed:', error.message);
    }

    console.log('\n✅ Notification Test Complete!\n');
    console.log('📋 Summary:');
    console.log('  - All notification methods are callable');
    console.log('  - Notifications will be sent to connected Socket.IO clients');
    console.log('  - To see actual events, connect a client and monitor console\n');

    console.log('💡 To test with a real client:');
    console.log('  1. Start the server: npm run start');
    console.log('  2. Open the frontend app');
    console.log('  3. Open browser console');
    console.log('  4. Look for "notification" events\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testNotifications();
