const { getIO } = require('../socket');
const { logger } = require('./logger');
const notificationPreferencesService = require('../services/notificationPreferencesService');

/**
 * Service de notifications en temps réel via Socket.IO
 * 
 * Ce service permet d'envoyer des notifications aux joueurs en temps réel
 * pour les événements importants du jeu (achievements, leaderboard, battle pass, etc.)
 */
class NotificationService {
  /**
   * Types de notifications disponibles
   */
  static TYPES = {
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    LEADERBOARD_RANK_CHANGED: 'leaderboard_rank_changed',
    LEADERBOARD_TOP_ENTRY: 'leaderboard_top_entry',
    BATTLE_PASS_TIER_UP: 'battle_pass_tier_up',
    BATTLE_PASS_REWARD_AVAILABLE: 'battle_pass_reward_available',
    QUEST_COMPLETED: 'quest_completed',
    BUILDING_COMPLETED: 'building_completed',
    RESEARCH_COMPLETED: 'research_completed',
    COMBAT_RESULT: 'combat_result',
    RESOURCE_LOW: 'resource_low',
    CITY_ATTACKED: 'city_attacked'
  };

  /**
   * Priorités des notifications
   */
  static PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Envoie une notification à un utilisateur spécifique
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type de notification (TYPES)
   * @param {Object} data - Données de la notification
   * @param {string} data.title - Titre de la notification
   * @param {string} data.message - Message de la notification
   * @param {string} [data.icon] - Icône de la notification
   * @param {string} [data.link] - Lien vers une page (ex: '/achievements')
   * @param {string} [priority='medium'] - Priorité de la notification
   */
  static async sendToUser(userId, type, data, priority = NotificationService.PRIORITIES.MEDIUM) {
    try {
      const prefs = await notificationPreferencesService.getPreferences(userId);
      if (!prefs.inAppEnabled) {
        logger.info('Notification skipped due to user preferences', { userId, type });
        return;
      }
    try {
      const io = getIO();
      if (!io) {
        logger.warn('Socket.IO not initialized, skipping notification');
        return;
      }

      const notification = {
        type,
        ...data,
        priority,
        timestamp: new Date().toISOString()
      };

      // Envoyer à tous les sockets de l'utilisateur (multi-device)
      io.to(`user_${userId}`).emit('notification', notification);

      logger.info(`Notification sent to user ${userId}:`, {
        type,
        title: data.title,
        priority
      });
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  /**
   * Envoie une notification broadcast à tous les utilisateurs connectés
   * 
   * @param {string} type - Type de notification
   * @param {Object} data - Données de la notification
   * @param {string} [priority='low'] - Priorité de la notification
   */
  static sendBroadcast(type, data, priority = NotificationService.PRIORITIES.LOW) {
    try {
      const io = getIO();
      if (!io) {
        logger.warn('Socket.IO not initialized, skipping broadcast');
        return;
      }

      const notification = {
        type,
        ...data,
        priority,
        timestamp: new Date().toISOString()
      };

      io.emit('notification', notification);

      logger.info(`Broadcast notification sent:`, {
        type,
        title: data.title,
        priority
      });
    } catch (error) {
      logger.error('Error sending broadcast notification:', error);
    }
  }

  /**
   * Envoie une notification d'achievement débloqué
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} achievement - Objet achievement
   */
  static notifyAchievementUnlocked(userId, achievement) {
    this.sendToUser(
      userId,
      this.TYPES.ACHIEVEMENT_UNLOCKED,
      {
        title: '🏆 Achievement Unlocked!',
        message: `You unlocked: ${achievement.name}`,
        icon: achievement.icon_url || 'trophy',
        link: '/achievements',
        achievementId: achievement.id,
        achievementName: achievement.name,
        achievementDescription: achievement.description
      },
      this.PRIORITIES.MEDIUM
    );
  }

  /**
   * Envoie une notification de changement de rang dans le leaderboard
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @param {number} oldRank - Ancien rang
   * @param {number} newRank - Nouveau rang
   */
  static notifyLeaderboardRankChanged(userId, category, oldRank, newRank) {
    const rankDiff = oldRank - newRank;
    const improved = rankDiff > 0;

    // Seuil: notifier seulement si changement >= 5 rangs ou entrée/sortie top 10
    const shouldNotify = 
      Math.abs(rankDiff) >= 5 || 
      (oldRank > 10 && newRank <= 10) ||
      (oldRank <= 10 && newRank > 10);

    if (!shouldNotify) return;

    const emoji = improved ? '📈' : '📉';
    const action = improved ? 'climbed' : 'dropped';
    const priority = (newRank <= 10 || oldRank <= 10) 
      ? this.PRIORITIES.HIGH 
      : this.PRIORITIES.MEDIUM;

    this.sendToUser(
      userId,
      this.TYPES.LEADERBOARD_RANK_CHANGED,
      {
        title: `${emoji} Leaderboard Update`,
        message: `You ${action} ${Math.abs(rankDiff)} positions in ${category}! (Rank #${newRank})`,
        icon: 'leaderboard',
        link: `/leaderboard?category=${category}`,
        category,
        oldRank,
        newRank,
        rankDiff
      },
      priority
    );
  }

  /**
   * Envoie une notification d'entrée dans le top du leaderboard
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {string} category - Catégorie du leaderboard
   * @param {number} rank - Nouveau rang
   */
  static notifyLeaderboardTopEntry(userId, category, rank) {
    if (rank > 10) return; // Seulement pour le top 10

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const medal = medals[rank] || '🏅';

    this.sendToUser(
      userId,
      this.TYPES.LEADERBOARD_TOP_ENTRY,
      {
        title: `${medal} Top ${rank} in ${category}!`,
        message: `Congratulations! You're now ranked #${rank} in the ${category} leaderboard!`,
        icon: 'trophy',
        link: `/leaderboard?category=${category}`,
        category,
        rank
      },
      this.PRIORITIES.HIGH
    );
  }

  /**
   * Envoie une notification de montée de tier dans le Battle Pass
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {number} newTier - Nouveau tier
   * @param {number} newXP - XP actuel
   */
  static notifyBattlePassTierUp(userId, newTier, newXP) {
    this.sendToUser(
      userId,
      this.TYPES.BATTLE_PASS_TIER_UP,
      {
        title: '⭐ Battle Pass Tier Up!',
        message: `You reached Tier ${newTier}! Check your rewards.`,
        icon: 'star',
        link: '/battle-pass',
        tier: newTier,
        xp: newXP
      },
      this.PRIORITIES.HIGH
    );
  }

  /**
   * Envoie une notification de récompenses Battle Pass disponibles
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {number} rewardCount - Nombre de récompenses disponibles
   */
  static notifyBattlePassRewardsAvailable(userId, rewardCount) {
    this.sendToUser(
      userId,
      this.TYPES.BATTLE_PASS_REWARD_AVAILABLE,
      {
        title: '🎁 Battle Pass Rewards Ready!',
        message: `You have ${rewardCount} reward(s) to claim!`,
        icon: 'gift',
        link: '/battle-pass',
        rewardCount
      },
      this.PRIORITIES.MEDIUM
    );
  }

  /**
   * Envoie une notification de quête complétée
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} quest - Objet quest
   */
  static notifyQuestCompleted(userId, quest) {
    this.sendToUser(
      userId,
      this.TYPES.QUEST_COMPLETED,
      {
        title: '✅ Quest Completed!',
        message: `${quest.title} - Claim your rewards!`,
        icon: 'check',
        link: '/quests',
        questId: quest.id,
        questTitle: quest.title
      },
      this.PRIORITIES.MEDIUM
    );
  }

  /**
   * Envoie une notification de bâtiment terminé
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} building - Objet building
   */
  static notifyBuildingCompleted(userId, building) {
    this.sendToUser(
      userId,
      this.TYPES.BUILDING_COMPLETED,
      {
        title: '🏗️ Construction Complete!',
        message: `${building.name} is now level ${building.level}`,
        icon: 'building',
        link: '/city',
        buildingId: building.id,
        buildingName: building.name,
        buildingLevel: building.level
      },
      this.PRIORITIES.LOW
    );
  }

  /**
   * Envoie une notification de recherche terminée
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} research - Objet research
   */
  static notifyResearchCompleted(userId, research) {
    this.sendToUser(
      userId,
      this.TYPES.RESEARCH_COMPLETED,
      {
        title: '🔬 Research Complete!',
        message: `${research.name} is now level ${research.level}`,
        icon: 'flask',
        link: '/research',
        researchId: research.id,
        researchName: research.name,
        researchLevel: research.level
      },
      this.PRIORITIES.LOW
    );
  }

  /**
   * Envoie une notification de résultat de combat
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {string} outcome - Résultat ('victory' ou 'defeat')
   * @param {Object} details - Détails du combat
   */
  static notifyCombatResult(userId, outcome, details) {
    const isVictory = outcome === 'victory' || outcome === 'attacker_victory';
    const emoji = isVictory ? '⚔️' : '💀';
    const title = isVictory ? 'Victory!' : 'Defeat';
    const priority = isVictory ? this.PRIORITIES.HIGH : this.PRIORITIES.MEDIUM;

    this.sendToUser(
      userId,
      this.TYPES.COMBAT_RESULT,
      {
        title: `${emoji} ${title}`,
        message: isVictory 
          ? 'Your attack was successful!' 
          : 'Your forces were defeated...',
        icon: 'sword',
        link: '/combat/history',
        outcome,
        ...details
      },
      priority
    );
  }

  /**
   * Envoie une notification de ville attaquée
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} attackDetails - Détails de l'attaque
   */
  static notifyCityAttacked(userId, attackDetails) {
    this.sendToUser(
      userId,
      this.TYPES.CITY_ATTACKED,
      {
        title: '⚠️ Your City is Under Attack!',
        message: `${attackDetails.attackerName} is attacking ${attackDetails.cityName}!`,
        icon: 'alert',
        link: '/defense',
        ...attackDetails
      },
      this.PRIORITIES.CRITICAL
    );
  }

  /**
   * Envoie une notification de ressources basses
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {string} resourceType - Type de ressource
   * @param {number} currentAmount - Quantité actuelle
   */
  static notifyResourceLow(userId, resourceType, currentAmount) {
    this.sendToUser(
      userId,
      this.TYPES.RESOURCE_LOW,
      {
        title: '⚠️ Low Resources',
        message: `Your ${resourceType} is running low (${currentAmount} remaining)`,
        icon: 'warning',
        link: '/resources',
        resourceType,
        currentAmount
      },
      this.PRIORITIES.LOW
    );
  }
}

module.exports = NotificationService;
