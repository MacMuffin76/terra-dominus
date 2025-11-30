/**
 * Achievement System Test Script
 * Tests achievement tracking, progress, and reward claiming
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api/v1';

// Test configuration
let authToken = null;
let testUserId = null;

/**
 * Authenticate and get token
 */
async function login(username, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    authToken = response.data.token;
    testUserId = response.data.user.id;
    console.log('✓ Login successful');
    console.log(`  User: ${username} (ID: ${testUserId})`);
    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('✗ Login failed:', errorMsg);
    if (error.response?.status) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response data:`, error.response.data);
    }
    if (error.code) {
      console.error(`  Error code: ${error.code}`);
    }
    console.error(`  Attempted URL: ${API_URL}/auth/login`);
    console.error(`  Username: ${username}`);
    return false;
  }
}

/**
 * Get authorization headers
 */
function getHeaders() {
  return {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Test: Get all achievements
 */
async function testGetAllAchievements() {
  console.log('\n📋 Test: Get All Achievements');
  try {
    const response = await axios.get(`${API_URL}/achievements`, getHeaders());
    const achievements = response.data;
    
    console.log(`✓ Retrieved ${achievements.length} achievements`);
    console.log(`  Categories: ${[...new Set(achievements.map(a => a.category))].join(', ')}`);
    console.log(`  Tiers: ${[...new Set(achievements.map(a => a.tier))].join(', ')}`);
    
    return achievements;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Test: Get user achievements
 */
async function testGetUserAchievements() {
  console.log('\n👤 Test: Get User Achievements');
  try {
    const response = await axios.get(`${API_URL}/achievements/user`, getHeaders());
    const userAchievements = response.data;
    
    const unlocked = userAchievements.filter(ua => ua.unlocked_at !== null).length;
    const claimed = userAchievements.filter(ua => ua.claimed_at !== null).length;
    
    console.log(`✓ Retrieved ${userAchievements.length} user achievements`);
    console.log(`  Unlocked: ${unlocked}`);
    console.log(`  Claimed: ${claimed}`);
    console.log(`  In Progress: ${userAchievements.length - unlocked}`);
    
    return userAchievements;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Test: Get achievement statistics
 */
async function testGetStats() {
  console.log('\n📊 Test: Get Achievement Statistics');
  try {
    const response = await axios.get(`${API_URL}/achievements/stats`, getHeaders());
    const stats = response.data;
    
    console.log('✓ Statistics retrieved:');
    console.log(`  Total Achievements: ${stats.totalAchievements}`);
    console.log(`  Unlocked: ${stats.unlockedAchievements}`);
    console.log(`  Claimed: ${stats.claimedAchievements}`);
    console.log(`  Total Points: ${stats.totalPoints}`);
    console.log(`  Completion: ${stats.completionPercentage.toFixed(1)}%`);
    
    if (stats.categoryProgress) {
      console.log('\n  Category Progress:');
      Object.entries(stats.categoryProgress).forEach(([category, data]) => {
        console.log(`    ${category}: ${data.unlocked}/${data.total}`);
      });
    }
    
    return stats;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Test: Filter achievements by category
 */
async function testFilterByCategory(category) {
  console.log(`\n🔍 Test: Filter by Category (${category})`);
  try {
    const response = await axios.get(`${API_URL}/achievements/user?category=${category}`, getHeaders());
    const filtered = response.data;
    
    console.log(`✓ Retrieved ${filtered.length} achievements in category '${category}'`);
    filtered.slice(0, 3).forEach(ua => {
      console.log(`  - ${ua.achievement.title} (${ua.achievement.tier})`);
    });
    
    return filtered;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Test: Claim achievement rewards
 */
async function testClaimRewards(achievementId) {
  console.log(`\n💎 Test: Claim Achievement Rewards (ID: ${achievementId})`);
  try {
    const response = await axios.post(
      `${API_URL}/achievements/${achievementId}/claim`,
      {},
      getHeaders()
    );
    const result = response.data;
    
    console.log('✓ Rewards claimed successfully:');
    console.log(`  Achievement: ${result.achievement.title}`);
    
    if (result.rewards) {
      console.log('  Rewards received:');
      if (result.rewards.or > 0) console.log(`    🪙 Gold: ${result.rewards.or.toLocaleString()}`);
      if (result.rewards.metal > 0) console.log(`    ⚙️ Metal: ${result.rewards.metal.toLocaleString()}`);
      if (result.rewards.carburant > 0) console.log(`    ⛽ Fuel: ${result.rewards.carburant.toLocaleString()}`);
      if (result.rewards.xp > 0) console.log(`    ⭐ XP: ${result.rewards.xp.toLocaleString()}`);
      if (result.rewards.title) console.log(`    🎖️ Title: "${result.rewards.title}"`);
    }
    
    if (result.leveledUp) {
      console.log(`  🎉 LEVEL UP! New level: ${result.user.level}`);
    }
    
    return result;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Test: Get leaderboard
 */
async function testGetLeaderboard() {
  console.log('\n🏆 Test: Get Achievement Leaderboard');
  try {
    const response = await axios.get(`${API_URL}/achievements/leaderboard?limit=5`, getHeaders());
    const leaderboard = response.data;
    
    console.log(`✓ Retrieved top ${leaderboard.length} players:`);
    leaderboard.forEach((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`  ${medal} ${index + 1}. ${entry.pseudo}`);
      console.log(`      ${entry.total_achievements} achievements • ${entry.total_points.toLocaleString()} points`);
    });
    
    return leaderboard;
  } catch (error) {
    console.error('✗ Failed:', error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('🏆 ACHIEVEMENT SYSTEM TEST SUITE');
  console.log('='.repeat(60));

  // Login
  const username = process.env.TEST_USERNAME || 'admin';
  const password = process.env.TEST_PASSWORD || 'admin123';
  
  const loginSuccess = await login(username, password);
  if (!loginSuccess) {
    console.error('\n❌ Tests aborted: Login failed');
    process.exit(1);
  }

  // Run tests
  const achievements = await testGetAllAchievements();
  const userAchievements = await testGetUserAchievements();
  const stats = await testGetStats();
  
  // Test filtering
  await testFilterByCategory('combat');
  await testFilterByCategory('economy');
  
  // Test claiming (find an unlocked but unclaimed achievement)
  const unclaimedAchievement = userAchievements.find(
    ua => ua.unlocked_at !== null && ua.claimed_at === null
  );
  
  if (unclaimedAchievement) {
    await testClaimRewards(unclaimedAchievement.achievement.id);
  } else {
    console.log('\n💎 Test: Claim Achievement Rewards');
    console.log('⚠️  No unclaimed achievements available to test claiming');
  }
  
  // Test leaderboard
  await testGetLeaderboard();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Achievements: ${achievements.length}`);
  console.log(`User Progress: ${userAchievements.length} tracked`);
  console.log(`Overall Completion: ${stats?.completionPercentage.toFixed(1)}%`);
  console.log('\n✅ All tests completed');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
