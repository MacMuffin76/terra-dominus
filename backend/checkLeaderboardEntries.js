/**
 * Check leaderboard entries after initialization
 */

const { sequelize, LeaderboardEntry } = require('./models');

async function check() {
  try {
    const entries = await LeaderboardEntry.findAll({
      where: { user_id: [78, 79] },
      order: [['user_id', 'ASC'], ['category', 'ASC']]
    });

    console.log(`\n=== Leaderboard Entries ===\n`);
    console.log(`Found ${entries.length} entries:\n`);

    let currentUserId = null;
    entries.forEach(entry => {
      if (entry.user_id !== currentUserId) {
        currentUserId = entry.user_id;
        console.log(`User ${entry.user_id}:`);
      }
      console.log(`  - ${entry.category}: ${entry.score}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

check();
