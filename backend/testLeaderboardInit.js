/**
 * Test script to debug leaderboard initialization errors
 */

const { sequelize, User } = require('./models');
const leaderboardIntegration = require('./utils/leaderboardIntegration');

async function test() {
  try {
    console.log('=== Testing Leaderboard Initialization ===\n');

    // Get one user
    const user = await User.findOne({
      where: { id: 78 }
    });

    if (!user) {
      console.log('User 78 not found');
      await sequelize.close();
      return;
    }

    console.log(`Testing with user: ${user.username} (ID: ${user.id})\n`);

    // Test leaderboardService directly to see the real error
    const leaderboardService = require('./modules/leaderboard/application/LeaderboardService');
    
    console.log('1. Testing leaderboardService.updateScore directly...');
    try {
      await leaderboardService.updateScore(user.id, 'total_power', 1000);
      console.log('   ✅ Success - leaderboardService works');
    } catch (error) {
      console.log('   ❌ Error in leaderboardService:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test each update method individually with detailed error logging
    console.log('\n2. Testing updateTotalPower...');
    try {
      await leaderboardIntegration.updateTotalPower(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n3. Testing updateBuildingsScore...');
    try {
      await leaderboardIntegration.updateBuildingsScore(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n4. Testing updateResearchScore...');
    try {
      await leaderboardIntegration.updateResearchScore(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n5. Testing updateEconomyScore...');
    try {
      await leaderboardIntegration.updateEconomyScore(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n6. Testing updateAchievementsScore...');
    try {
      await leaderboardIntegration.updateAchievementsScore(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n7. Testing updateBattlePassScore...');
    try {
      await leaderboardIntegration.updateBattlePassScore(user.id);
      console.log('   ✅ Success');
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Check if leaderboard entries were actually created
    const { LeaderboardEntry } = require('./models');
    console.log('\n8. Checking LeaderboardEntry records...');
    const entries = await LeaderboardEntry.findAll({
      where: { user_id: user.id }
    });
    console.log(`   Found ${entries.length} entries:`);
    entries.forEach(entry => {
      console.log(`   - ${entry.category}: ${entry.score}`);
    });

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

test();
