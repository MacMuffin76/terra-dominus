/**
 * Integration test for Quest System
 * Tests the full flow: assign, progress, complete, claim
 */
const { Quest, UserQuest, User } = require('./models');
const QuestService = require('./modules/quest/application/QuestService');
const SequelizeQuestRepository = require('./modules/quest/infra/SequelizeQuestRepository');
const sequelize = require('./db');

async function testQuestSystem() {
  console.log('🧪 Testing Quest System Integration\n');
  
  try {
    // Setup
    const repository = new SequelizeQuestRepository({ Quest, UserQuest, User, sequelize });
    const questService = new QuestService({ questRepository: repository });
    
    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No user found in database');
      process.exit(1);
    }
    
    console.log(`✅ Testing with user: ${user.username} (ID: ${user.id})\n`);
    
    // Clean up any existing quests for this user
    await UserQuest.destroy({ where: { user_id: user.id } });
    console.log('🧹 Cleaned up existing user quests\n');
    
    // Test 1: Assign daily quests
    console.log('📝 Test 1: Assign daily quests');
    const dailyQuests = await questService.assignDailyQuests(user.id);
    console.log(`✅ Assigned ${dailyQuests.length} daily quests`);
    dailyQuests.forEach(q => {
      console.log(`   - ${q.quest.title} (${q.quest.key})`);
    });
    console.log('');
    
    // Test 2: Assign weekly quests
    console.log('📝 Test 2: Assign weekly quests');
    const weeklyQuests = await questService.assignWeeklyQuests(user.id);
    console.log(`✅ Assigned ${weeklyQuests.length} weekly quests`);
    weeklyQuests.forEach(q => {
      console.log(`   - ${q.quest.title} (${q.quest.key})`);
    });
    console.log('');
    
    // Test 3: Get user quests
    console.log('📝 Test 3: Get user quests');
    const userQuests = await questService.getUserQuests(user.id);
    console.log(`✅ Retrieved ${userQuests.length} quests for user`);
    console.log('');
    
    // Test 4: Get quest stats
    console.log('📝 Test 4: Get quest stats');
    const stats = await questService.getUserQuestStats(user.id);
    console.log('✅ Quest stats:');
    console.log(`   In progress: ${stats.in_progress}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Claimed: ${stats.claimed}`);
    console.log('');
    
    // Test 5: Update progress on first quest
    if (dailyQuests.length > 0) {
      const firstQuest = dailyQuests[0];
      console.log(`📝 Test 5: Update progress on quest "${firstQuest.quest.title}"`);
      const updated = await questService.updateQuestProgress(
        user.id, 
        firstQuest.quest_id, 
        firstQuest.quest.objective_target // Complete it fully
      );
      console.log(`✅ Progress updated, status: ${updated.status}`);
      console.log('');
      
      // Test 6: Claim rewards
      if (updated.status === 'completed') {
        console.log(`📝 Test 6: Claim rewards for quest "${firstQuest.quest.title}"`);
        const result = await questService.claimRewards(user.id, firstQuest.quest_id);
        console.log('✅ Rewards claimed:');
        console.log(`   Gold: ${result.rewards.or} 💰`);
        console.log(`   Metal: ${result.rewards.metal} ⚙️`);
        console.log(`   Fuel: ${result.rewards.carburant} ⛽`);
        console.log(`   XP: ${result.rewards.xp} ⭐`);
        if (result.leveledUp) {
          console.log(`   🎉 Leveled up to ${result.newLevel}!`);
        }
      }
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('✨ Quest system is working correctly!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testQuestSystem();
