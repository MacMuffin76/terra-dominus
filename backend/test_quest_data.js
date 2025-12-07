/**
 * Simple test script to check quest data in database
 */
const { Quest, UserQuest } = require('./models');

async function testQuestData() {
  console.log('🧪 Testing Quest System Data\n');
  
  try {
    // Test 1: Count all quests
    const totalQuests = await Quest.count();
    console.log(`✅ Total quests in database: ${totalQuests}`);
    
    // Test 2: Count by type
    const dailyCount = await Quest.count({ where: { type: 'daily', is_active: true } });
    const weeklyCount = await Quest.count({ where: { type: 'weekly', is_active: true } });
    const achievementCount = await Quest.count({ where: { type: 'achievement', is_active: true } });
    
    console.log(`\n📊 Quest counts by type:`);
    console.log(`   Daily: ${dailyCount}`);
    console.log(`   Weekly: ${weeklyCount}`);
    console.log(`   Achievement: ${achievementCount}`);
    
    // Test 3: Show some daily quests
    const dailyQuests = await Quest.findAll({ 
      where: { type: 'daily', is_active: true },
      limit: 5 
    });
    
    console.log(`\n📋 Sample daily quests:`);
    dailyQuests.forEach(q => {
      console.log(`   - ${q.title} (${q.key})`);
      console.log(`     Category: ${q.category}, Difficulty: ${q.difficulty}`);
      console.log(`     Objective: ${q.objective_type} x${q.objective_target}`);
      console.log(`     Rewards: ${q.reward_or} 💰, ${q.reward_xp} XP`);
    });
    
    // Test 4: Show some weekly quests
    const weeklyQuests = await Quest.findAll({ 
      where: { type: 'weekly', is_active: true },
      limit: 3 
    });
    
    console.log(`\n📅 Sample weekly quests:`);
    weeklyQuests.forEach(q => {
      console.log(`   - ${q.title} (${q.key})`);
      console.log(`     Category: ${q.category}, Difficulty: ${q.difficulty}`);
      console.log(`     Objective: ${q.objective_type} x${q.objective_target}`);
      console.log(`     Rewards: ${q.reward_or} 💰, ${q.reward_xp} XP`);
    });
    
    console.log('\n🎉 Quest data is available and ready!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testQuestData();
