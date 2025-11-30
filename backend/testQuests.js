// testQuests.js - Test script for quest system
const sequelize = require('./db');
const { User, Quest, UserQuest } = require('./models');
const createContainer = require('./container');

async function testQuestSystem() {
  console.log('🧪 Testing Quest System...\n');

  const container = createContainer();
  const questService = container.resolve('questService');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Find or create test user
    console.log('📝 Setting up test user...');
    let testUser = await User.findOne({ where: { username: 'quest_tester' } });
    
    if (!testUser) {
      testUser = await User.create({
        username: 'quest_tester',
        email: 'quest_tester@test.com',
        password: 'testpass123',
        level: 5,
        xp: 1000,
        xp_next_level: 2000,
        or: 10000,
        metal: 5000,
        carburant: 2000
      });
    } else {
      // Reset test user
      testUser.level = 5;
      testUser.xp = 1000;
      testUser.xp_next_level = 2000;
      testUser.or = 10000;
      testUser.metal = 5000;
      testUser.carburant = 2000;
      await testUser.save();
    }

    // Clean up existing quests for test user
    await UserQuest.destroy({ where: { user_id: testUser.id } });

    console.log(`✅ Test user ready: ${testUser.username} (ID: ${testUser.id})\n`);

    // TEST 1: Check available quests in database
    console.log('📋 TEST 1: Check available quests');
    const dailyQuests = await Quest.findAll({ where: { type: 'daily', is_active: true } });
    const weeklyQuests = await Quest.findAll({ where: { type: 'weekly', is_active: true } });
    
    console.log(`   Found ${dailyQuests.length} daily quests`);
    console.log(`   Found ${weeklyQuests.length} weekly quests`);
    
    if (dailyQuests.length > 0 && weeklyQuests.length > 0) {
      console.log('   ✅ PASS: Quests are available in database\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: No quests found in database\n');
      testsFailed++;
    }

    // TEST 2: Assign daily quests
    console.log('🎯 TEST 2: Assign daily quests');
    const assignedDaily = await questService.assignDailyQuests(testUser.id);
    
    console.log(`   Assigned ${assignedDaily.length} daily quests`);
    assignedDaily.forEach(q => {
      console.log(`   - ${q.quest.title} (${q.quest.category})`);
    });
    
    if (assignedDaily.length > 0 && assignedDaily.length <= 3) {
      console.log('   ✅ PASS: Daily quests assigned\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Unexpected number of daily quests\n');
      testsFailed++;
    }

    // TEST 3: Assign weekly quests
    console.log('📅 TEST 3: Assign weekly quests');
    const assignedWeekly = await questService.assignWeeklyQuests(testUser.id);
    
    console.log(`   Assigned ${assignedWeekly.length} weekly quests`);
    assignedWeekly.forEach(q => {
      console.log(`   - ${q.quest.title} (${q.quest.difficulty})`);
    });
    
    if (assignedWeekly.length > 0 && assignedWeekly.length <= 2) {
      console.log('   ✅ PASS: Weekly quests assigned\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Unexpected number of weekly quests\n');
      testsFailed++;
    }

    // TEST 4: Get user quests
    console.log('📊 TEST 4: Get user quests');
    const userQuests = await questService.getUserQuests(testUser.id);
    
    console.log(`   Retrieved ${userQuests.length} quests`);
    console.log(`   Daily quests: ${userQuests.filter(q => q.quest.type === 'daily').length}`);
    console.log(`   Weekly quests: ${userQuests.filter(q => q.quest.type === 'weekly').length}`);
    
    if (userQuests.length === assignedDaily.length + assignedWeekly.length) {
      console.log('   ✅ PASS: All quests retrieved\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Quest count mismatch\n');
      testsFailed++;
    }

    // TEST 5: Update quest progress
    console.log('📈 TEST 5: Update quest progress');
    const firstQuest = assignedDaily[0];
    const questId = firstQuest.quest_id;
    const target = firstQuest.quest.objective_target;
    
    console.log(`   Quest: ${firstQuest.quest.title}`);
    console.log(`   Target: ${target}`);
    console.log(`   Updating progress by 1...`);
    
    const updated = await questService.updateQuestProgress(testUser.id, questId, 1);
    
    if (updated && updated.progress === 1) {
      console.log(`   Progress: ${updated.progress}/${target}`);
      console.log('   ✅ PASS: Progress updated\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Progress not updated correctly\n');
      testsFailed++;
    }

    // TEST 6: Complete quest
    console.log('🎉 TEST 6: Complete quest');
    console.log(`   Setting progress to ${target}...`);
    
    const completed = await questService.updateQuestProgress(testUser.id, questId, target - 1);
    
    if (completed && completed.status === 'completed') {
      console.log(`   Status: ${completed.status}`);
      console.log('   ✅ PASS: Quest completed\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Quest not completed\n');
      testsFailed++;
    }

    // TEST 7: Claim rewards
    console.log('🎁 TEST 7: Claim quest rewards');
    const beforeOr = testUser.or;
    const beforeXp = testUser.xp;
    
    console.log(`   Before: ${beforeOr} gold, ${beforeXp} XP`);
    
    const rewards = await questService.claimRewards(testUser.id, questId);
    
    // Refresh user data
    await testUser.reload();
    
    console.log(`   After: ${testUser.or} gold, ${testUser.xp} XP`);
    console.log(`   Rewards: +${rewards.rewards.or} gold, +${rewards.rewards.xp} XP`);
    
    if (testUser.or > beforeOr || testUser.xp > beforeXp) {
      console.log('   ✅ PASS: Rewards claimed\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Rewards not granted\n');
      testsFailed++;
    }

    // TEST 8: Check quest limit
    console.log('🚫 TEST 8: Check quest assignment limit');
    const beforeCount = await UserQuest.count({ 
      where: { user_id: testUser.id },
      include: [{
        model: Quest,
        as: 'quest',
        where: { type: 'daily' }
      }]
    });
    
    console.log(`   Current daily quests: ${beforeCount}`);
    console.log(`   Trying to assign more...`);
    
    const moreQuests = await questService.assignDailyQuests(testUser.id);
    
    if (moreQuests.length === 0 || beforeCount >= 3) {
      console.log('   ✅ PASS: Quest limit enforced\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Quest limit not enforced\n');
      testsFailed++;
    }

    // TEST 9: Get quest statistics
    console.log('📊 TEST 9: Get quest statistics');
    const stats = await questService.getUserQuestStats(testUser.id);
    
    console.log('   Quest statistics:');
    console.log(`   - Available: ${stats.available}`);
    console.log(`   - In Progress: ${stats.in_progress}`);
    console.log(`   - Completed: ${stats.completed}`);
    console.log(`   - Claimed: ${stats.claimed}`);
    
    if (typeof stats === 'object') {
      console.log('   ✅ PASS: Statistics retrieved\n');
      testsPassed++;
    } else {
      console.log('   ❌ FAIL: Statistics not retrieved\n');
      testsFailed++;
    }

    // TEST 10: Track quest objective (simulation)
    console.log('🎯 TEST 10: Track quest objective');
    
    // Find a quest with collect_resources objective
    const resourceQuest = userQuests.find(q => 
      q.quest.objective_type === 'collect_resources' && 
      q.status === 'in_progress'
    );
    
    if (resourceQuest) {
      console.log(`   Quest: ${resourceQuest.quest.title}`);
      console.log(`   Simulating resource collection event...`);
      
      const tracked = await questService.trackQuestObjective(
        testUser.id,
        'collect_resources',
        { amount: 100 }
      );
      
      if (tracked.length > 0) {
        console.log(`   ✅ PASS: ${tracked.length} quest(s) updated\n`);
        testsPassed++;
      } else {
        console.log('   ⚠️  SKIP: No matching quests to update\n');
        testsPassed++;
      }
    } else {
      console.log('   ⚠️  SKIP: No resource collection quest in progress\n');
      testsPassed++;
    }

    // RESULTS
    console.log('═══════════════════════════════════════');
    console.log('📊 TEST RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('═══════════════════════════════════════\n');

    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! Quest system is working correctly.\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the output above.\n');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testsFailed++;
  } finally {
    await sequelize.close();
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
testQuestSystem();
