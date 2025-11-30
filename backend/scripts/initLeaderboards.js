#!/usr/bin/env node
/**
 * Leaderboard Initialization Script
 * 
 * Ce script calcule et initialise les scores de leaderboard pour tous les utilisateurs existants.
 * Utile pour :
 * - Initialisation initiale du système de leaderboard
 * - Recalcul après des modifications de formules
 * - Correction de données
 * 
 * Usage:
 *   npm run init-leaderboards
 *   ou
 *   node scripts/initLeaderboards.js [--users=1,2,3] [--categories=total_power,economy]
 */

const { sequelize, User } = require('../models');
const leaderboardIntegration = require('../utils/leaderboardIntegration');
const { logger } = require('../utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
let specificUsers = null;
let specificCategories = null;

args.forEach(arg => {
  if (arg.startsWith('--users=')) {
    specificUsers = arg.split('=')[1].split(',').map(id => parseInt(id, 10));
  }
  if (arg.startsWith('--categories=')) {
    specificCategories = arg.split('=')[1].split(',');
  }
});

const CATEGORIES = [
  'total_power',
  'economy',
  'combat_victories',
  'buildings',
  'research',
  'resources',
  'portals',
  'achievements',
  'battle_pass'
];

async function initializeLeaderboards() {
  console.log('\n=== Leaderboard Initialization Script ===\n');
  
  try {
    // Get all users or specific ones
    let users;
    if (specificUsers && specificUsers.length > 0) {
      users = await User.findAll({
        where: { id: specificUsers },
        attributes: ['id', 'username']
      });
      console.log(`📋 Processing ${users.length} specific user(s)\n`);
    } else {
      users = await User.findAll({
        attributes: ['id', 'username']
      });
      console.log(`📋 Processing all ${users.length} user(s)\n`);
    }

    if (users.length === 0) {
      console.log('⚠ No users found');
      await sequelize.close();
      process.exit(0);
    }

    const categoriesToProcess = specificCategories || CATEGORIES;
    console.log(`📊 Categories: ${categoriesToProcess.join(', ')}\n`);

    let totalProcessed = 0;
    let totalErrors = 0;
    const startTime = Date.now();

    // Progress tracking
    const updateProgress = (current, total) => {
      const percent = Math.round((current / total) * 100);
      const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
      process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total})`);
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      updateProgress(i, users.length);

      try {
        // Update all scores for this user
        const updates = [];

        for (const category of categoriesToProcess) {
          try {
            switch (category) {
              case 'total_power':
                updates.push(leaderboardIntegration.updateTotalPower(user.id));
                break;
              case 'economy':
                updates.push(leaderboardIntegration.updateEconomyScore(user.id));
                break;
              case 'buildings':
                updates.push(leaderboardIntegration.updateBuildingsScore(user.id));
                break;
              case 'research':
                updates.push(leaderboardIntegration.updateResearchScore(user.id));
                break;
              case 'achievements':
                updates.push(leaderboardIntegration.updateAchievementsScore(user.id));
                break;
              case 'battle_pass':
                updates.push(leaderboardIntegration.updateBattlePassScore(user.id));
                break;
              // Note: combat_victories, resources, portals sont des compteurs incrémentaux
              // Ils ne peuvent pas être recalculés facilement sans historique complet
            }
          } catch (error) {
            logger.error(`Error updating ${category} for user ${user.id}:`, error);
            totalErrors++;
          }
        }

        // Wait for all updates to complete
        await Promise.allSettled(updates);
        totalProcessed++;

      } catch (error) {
        logger.error(`Failed to process user ${user.id} (${user.username}):`, error);
        totalErrors++;
      }

      // Small delay to avoid overwhelming the database
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    updateProgress(users.length, users.length);
    console.log('\n');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Initialization Complete!\n');
    console.log('Summary:');
    console.log(`  Users processed: ${totalProcessed}/${users.length}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Average: ${(duration / users.length).toFixed(3)}s per user`);

    // Show sample results
    console.log('\n📊 Sample Results (first 5 users):');
    const { LeaderboardEntry } = require('../models');
    
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      const entries = await LeaderboardEntry.findAll({
        where: { user_id: user.id },
        attributes: ['category', 'score', 'rank']
      });

      console.log(`\n  ${user.username} (ID: ${user.id}):`);
      entries.forEach(entry => {
        console.log(`    ${entry.category}: ${entry.score} (rank #${entry.rank || '?'})`);
      });
    }

    console.log('\n💡 Tips:');
    console.log('  - Rankings are calculated automatically when scores are updated');
    console.log('  - Combat victories, resources, and portals require historical data');
    console.log('  - Run this script periodically to refresh data');
    console.log('  - Use --users=1,2,3 to process specific users');
    console.log('  - Use --categories=total_power,economy to process specific categories\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    logger.error('Leaderboard initialization error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeLeaderboards();
}

module.exports = initializeLeaderboards;
