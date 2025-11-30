const { logger } = require('../../../utils/logger');
const NotificationService = require('../../../utils/notificationService');
const { LeaderboardEntry, LeaderboardReward, UserLeaderboardReward, User } = require('../../../models');
const { Op } = require('sequelize');

/**
 * Service de gestion des leaderboards
 * Gère le calcul des rangs, les mises à jour des scores, et les récompenses
 */
class LeaderboardService {
  /**
   * Catégories de leaderboard disponibles
   */
  static CATEGORIES = {
    TOTAL_POWER: 'total_power',
    ECONOMY: 'economy',
    COMBAT_VICTORIES: 'combat_victories',
    BUILDINGS: 'buildings',
    RESEARCH: 'research',
    RESOURCES: 'resources',
    PORTALS: 'portals',
    ACHIEVEMENTS: 'achievements',
    BATTLE_PASS: 'battle_pass'
  };

  /**
   * Récupère le leaderboard pour une catégorie donnée
   * @param {string} category - Catégorie du leaderboard
   * @param {number} limit - Nombre d'entrées à retourner (défaut: 100)
   * @param {number} offset - Offset pour pagination (défaut: 0)
   * @returns {Promise<Array>} Liste des entrées classées
   */
  async getLeaderboard(category, limit = 100, offset = 0) {
    try {
      logger.info(`Getting leaderboard for category: ${category}, limit: ${limit}, offset: ${offset}`);

      const entries = await LeaderboardEntry.findAll({
        where: { category },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }],
        order: [
          ['score', 'DESC'],
          ['last_updated', 'ASC'] // En cas d'égalité, le plus ancien gagne
        ],
        limit,
        offset
      });

      // Calculer les rangs
      const rankedEntries = entries.map((entry, index) => ({
        rank: offset + index + 1,
        user: {
          id: entry.user.id,
          username: entry.user.username
        },
        score: parseInt(entry.score),
        previous_rank: entry.previous_rank,
        rank_change: entry.previous_rank ? entry.previous_rank - (offset + index + 1) : 0,
        last_updated: entry.last_updated
      }));

      logger.info(`Retrieved ${rankedEntries.length} entries for ${category}`);
      return rankedEntries;
    } catch (error) {
      logger.error(`Error getting leaderboard for ${category}:`, error);
      throw error;
    }
  }

  /**
   * Récupère la position d'un utilisateur dans un leaderboard
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @returns {Promise<Object|null>} Position de l'utilisateur ou null
   */
  async getUserPosition(userId, category) {
    try {
      const entry = await LeaderboardEntry.findOne({
        where: { user_id: userId, category },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }]
      });

      if (!entry) {
        return null;
      }

      // Calculer le rang en comptant les entrées avec un score supérieur
      const rank = await LeaderboardEntry.count({
        where: {
          category,
          [Op.or]: [
            { score: { [Op.gt]: entry.score } },
            {
              score: entry.score,
              last_updated: { [Op.lt]: entry.last_updated }
            }
          ]
        }
      }) + 1;

      return {
        rank,
        user: {
          id: entry.user.id,
          username: entry.user.username
        },
        score: parseInt(entry.score),
        previous_rank: entry.previous_rank,
        rank_change: entry.previous_rank ? entry.previous_rank - rank : 0,
        last_updated: entry.last_updated
      };
    } catch (error) {
      logger.error(`Error getting user position for user ${userId} in ${category}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le score d'un utilisateur dans un leaderboard
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @param {number} score - Nouveau score
   * @returns {Promise<Object>} Entrée mise à jour
   */
  async updateScore(userId, category, score) {
    try {
      logger.info(`Updating score for user ${userId} in ${category}: ${score}`);

      // Vérifier si l'entrée existe
      let entry = await LeaderboardEntry.findOne({
        where: { user_id: userId, category }
      });

      const oldRank = entry ? await this._calculateRank(userId, category) : null;

      if (entry) {
        // Calculer le rang actuel avant mise à jour
        const currentRank = oldRank;
        
        // Mettre à jour
        entry.previous_rank = currentRank;
        entry.score = score;
        entry.last_updated = new Date();
        await entry.save();
        
        logger.info(`Score updated for user ${userId} in ${category}`);
      } else {
        // Créer nouvelle entrée
        entry = await LeaderboardEntry.create({
          user_id: userId,
          category,
          score,
          last_updated: new Date()
        });
        
        logger.info(`New leaderboard entry created for user ${userId} in ${category}`);
      }

      // Calculer le nouveau rang après mise à jour
      const newRank = await this._calculateRank(userId, category);

      // Send notifications if rank changed significantly or entered top 10
      if (oldRank && newRank !== oldRank) {
        NotificationService.notifyLeaderboardRankChanged(userId, category, oldRank, newRank);
      }

      // Notify if newly entered top 10
      if (newRank <= 10 && (!oldRank || oldRank > 10)) {
        NotificationService.notifyLeaderboardTopEntry(userId, category, newRank);
      }

      return entry;
    } catch (error) {
      logger.error(`Error updating score for user ${userId} in ${category}:`, error);
      throw error;
    }
  }

  /**
   * Incrémente le score d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @param {number} amount - Montant à ajouter
   * @returns {Promise<Object>} Entrée mise à jour
   */
  async incrementScore(userId, category, amount) {
    try {
      const entry = await LeaderboardEntry.findOne({
        where: { user_id: userId, category }
      });

      const currentScore = entry ? parseInt(entry.score) : 0;
      const newScore = currentScore + amount;

      return await this.updateScore(userId, category, newScore);
    } catch (error) {
      logger.error(`Error incrementing score for user ${userId} in ${category}:`, error);
      throw error;
    }
  }

  /**
   * Recalcule tous les rangs pour une catégorie (maintenance)
   * @param {string} category - Catégorie du leaderboard
   */
  async recalculateRanks(category) {
    try {
      logger.info(`Recalculating ranks for category: ${category}`);

      const entries = await LeaderboardEntry.findAll({
        where: { category },
        order: [
          ['score', 'DESC'],
          ['last_updated', 'ASC']
        ]
      });

      for (let i = 0; i < entries.length; i++) {
        entries[i].rank = i + 1;
        await entries[i].save();
      }

      logger.info(`Ranks recalculated for ${entries.length} entries in ${category}`);
    } catch (error) {
      logger.error(`Error recalculating ranks for ${category}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les récompenses disponibles pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @param {number|null} seasonId - ID de la saison (null pour permanent)
   * @returns {Promise<Object>} Récompenses disponibles et déjà réclamées
   */
  async getUserRewards(userId, category, seasonId = null) {
    try {
      // Récupérer la position de l'utilisateur
      const position = await this.getUserPosition(userId, category);
      
      if (!position) {
        return { available: [], claimed: [] };
      }

      const rank = position.rank;

      // Récupérer toutes les récompenses pour cette catégorie
      const allRewards = await LeaderboardReward.findAll({
        where: {
          category,
          season_id: seasonId,
          rank_min: { [Op.lte]: rank },
          rank_max: { [Op.gte]: rank }
        }
      });

      // Récupérer les récompenses déjà réclamées
      const claimedRewardIds = await UserLeaderboardReward.findAll({
        where: {
          user_id: userId,
          season_id: seasonId
        },
        attributes: ['reward_id']
      });

      const claimedIds = claimedRewardIds.map(r => r.reward_id);

      const available = allRewards.filter(r => !claimedIds.includes(r.id));
      const claimed = allRewards.filter(r => claimedIds.includes(r.id));

      logger.info(`User ${userId} has ${available.length} available rewards and ${claimed.length} claimed in ${category}`);

      return {
        available: available.map(r => this._formatReward(r)),
        claimed: claimed.map(r => this._formatReward(r))
      };
    } catch (error) {
      logger.error(`Error getting rewards for user ${userId} in ${category}:`, error);
      throw error;
    }
  }

  /**
   * Réclame une récompense de leaderboard
   * @param {number} userId - ID de l'utilisateur
   * @param {number} rewardId - ID de la récompense
   * @returns {Promise<Object>} Résultat de la réclamation
   */
  async claimReward(userId, rewardId) {
    try {
      logger.info(`User ${userId} claiming reward ${rewardId}`);

      // Récupérer la récompense
      const reward = await LeaderboardReward.findByPk(rewardId);
      
      if (!reward) {
        throw new Error('Reward not found');
      }

      // Vérifier la position de l'utilisateur
      const position = await this.getUserPosition(userId, reward.category);
      
      if (!position) {
        throw new Error('User not in leaderboard');
      }

      const rank = position.rank;

      // Vérifier si l'utilisateur a le rang requis
      if (rank < reward.rank_min || rank > reward.rank_max) {
        throw new Error(`Rank ${rank} is not eligible for this reward (required: ${reward.rank_min}-${reward.rank_max})`);
      }

      // Vérifier si déjà réclamé
      const alreadyClaimed = await UserLeaderboardReward.findOne({
        where: {
          user_id: userId,
          reward_id: rewardId,
          season_id: reward.season_id
        }
      });

      if (alreadyClaimed) {
        throw new Error('Reward already claimed');
      }

      // Appliquer la récompense
      await this._applyReward(userId, reward);

      // Enregistrer la réclamation
      await UserLeaderboardReward.create({
        user_id: userId,
        reward_id: rewardId,
        season_id: reward.season_id,
        rank_achieved: rank
      });

      logger.info(`Reward ${rewardId} claimed successfully by user ${userId}`);

      return {
        success: true,
        reward: this._formatReward(reward)
      };
    } catch (error) {
      logger.error(`Error claiming reward ${rewardId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule le rang d'un utilisateur (helper interne)
   * @private
   */
  async _calculateRank(userId, category) {
    const entry = await LeaderboardEntry.findOne({
      where: { user_id: userId, category }
    });

    if (!entry) return null;

    const rank = await LeaderboardEntry.count({
      where: {
        category,
        [Op.or]: [
          { score: { [Op.gt]: entry.score } },
          {
            score: entry.score,
            last_updated: { [Op.lt]: entry.last_updated }
          }
        ]
      }
    }) + 1;

    return rank;
  }

  /**
   * Applique une récompense à un utilisateur (helper interne)
   * @private
   */
  async _applyReward(userId, reward) {
    const { reward_type, reward_data } = reward;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    switch (reward_type) {
      case 'premium_currency':
        // TODO: Implémenter système de monnaie premium
        logger.info(`Would grant ${reward_data.amount} premium currency to user ${userId}`);
        break;

      case 'resources':
        if (reward_data.or) user.or = (user.or || 0) + reward_data.or;
        if (reward_data.metal) user.metal = (user.metal || 0) + reward_data.metal;
        if (reward_data.carburant) user.carburant = (user.carburant || 0) + reward_data.carburant;
        await user.save();
        logger.info(`Granted resources to user ${userId}`);
        break;

      case 'title':
      case 'cosmetic':
      case 'badge':
      case 'building_skin':
        // TODO: Implémenter système cosmétique
        logger.info(`Would grant cosmetic ${reward_data.type || 'title'} to user ${userId}`);
        break;

      case 'unit':
        // TODO: Implémenter octroi d'unités
        logger.info(`Would grant units to user ${userId}`);
        break;

      case 'boost':
        // TODO: Implémenter système de boost
        logger.info(`Would grant boost to user ${userId}`);
        break;

      default:
        logger.warn(`Unknown reward type: ${reward_type}`);
    }
  }

  /**
   * Formate une récompense pour l'API (helper interne)
   * @private
   */
  _formatReward(reward) {
    return {
      id: reward.id,
      category: reward.category,
      rank_min: reward.rank_min,
      rank_max: reward.rank_max,
      reward_type: reward.reward_type,
      reward_data: reward.reward_data,
      display_name: reward.display_name,
      display_icon: reward.display_icon
    };
  }
}

module.exports = new LeaderboardService();
