require('dotenv').config();
const { LeaderboardEntry, User } = require('./models');

async function checkLeaderboardData() {
  try {
    console.log('\n=== Vérification des données leaderboard ===\n');

    // Compter le nombre total d'entrées
    const totalCount = await LeaderboardEntry.count();
    console.log(`Total d'entrées dans leaderboard_entries: ${totalCount}`);

    // Compter par catégorie
    const categories = ['total_power', 'economy', 'combat_victories', 'buildings', 'research', 'resources', 'portals', 'achievements', 'battle_pass'];
    
    for (const category of categories) {
      const count = await LeaderboardEntry.count({ where: { category } });
      console.log(`  - ${category}: ${count} entrées`);
    }

    // Afficher quelques entrées d'exemple
    console.log("\n=== Exemples d'entrees (buildings) ===\n");
    const buildingsEntries = await LeaderboardEntry.findAll({
      where: { category: 'buildings' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      limit: 5,
      order: [['score', 'DESC']]
    });

    buildingsEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.user?.username || 'Unknown'} - Score: ${entry.score} - Rank: ${entry.rank}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkLeaderboardData();
