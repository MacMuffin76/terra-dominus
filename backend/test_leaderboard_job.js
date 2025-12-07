require('dotenv').config();
const { updateLeaderboards } = require('./jobs/leaderboardUpdateJob');

async function testJob() {
  console.log('=== Test du job leaderboard ===\n');
  try {
    await updateLeaderboards();
    console.log('\n✅ Job executé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testJob();
