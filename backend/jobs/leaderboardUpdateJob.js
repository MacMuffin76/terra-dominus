const { LeaderboardEntry, User } = require('../models');
const leaderboardService = require('../modules/leaderboard/application/LeaderboardService');
const LeaderboardService = require('../modules/leaderboard/application/LeaderboardService').constructor;
const sequelize = require('../db');
const { Op } = require('sequelize');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'LeaderboardUpdateJob' });

/**
 * Job pour mettre à jour les leaderboards toutes les 5 minutes
 */
async function updateLeaderboards() {
  const transaction = await sequelize.transaction();
  try {
    logger.info('Starting leaderboard update job');

    // Exemple: Mettre à jour le leaderboard total_power en fonction du niveau de puissance des users
    // Ici on suppose que la puissance totale est calculée via une fonction getUserTotalPower(userId)
    // Vous devez adapter cette partie selon votre logique métier réelle

    // Récupérer tous les utilisateurs
    const users = await User.findAll({ transaction });

    for (const user of users) {
      // Calculer la puissance totale (exemple simplifié)
      const totalPower = await calculateUserTotalPower(user.id);

      // Mettre à jour ou créer l'entrée leaderboard
      let entry = await LeaderboardEntry.findOne({
        where: { user_id: user.id, category: LeaderboardService.CATEGORIES.TOTAL_POWER },
        transaction
      });

      if (entry) {
        entry.score = totalPower;
        entry.last_updated = new Date();
        await entry.save({ transaction });
      } else {
        await LeaderboardEntry.create({
          user_id: user.id,
          category: LeaderboardService.CATEGORIES.TOTAL_POWER,
          score: totalPower,
          last_updated: new Date()
        }, { transaction });
      }
    }

    await transaction.commit();
    
    // Recalculer les rangs après le commit
    await leaderboardService.recalculateRanks(LeaderboardService.CATEGORIES.TOTAL_POWER);
    
    logger.info('Leaderboard update job completed successfully');
  } catch (error) {
    await transaction.rollback();
    logger.error('Error in leaderboard update job:', error);
    console.error('Full error:', error);
    throw error;
  }
}

/**
 * Fonction exemple pour calculer la puissance totale d'un utilisateur
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function calculateUserTotalPower(userId) {
  // TODO: Implémenter la vraie logique de calcul de puissance
  // Pour l'instant, retourne un score fictif
  return Math.floor(Math.random() * 10000);
}

module.exports = { updateLeaderboards };
