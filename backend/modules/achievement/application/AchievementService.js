// AchievementService.js - Business logic for achievement system
const { logger, runWithContext } = require('../../../utils/logger');
const {
  isAchievementUnlocked,
  calculateAchievementRewards,
  parseRewardItems,
  getAchievementProgressPercentage,
  shouldDisplayAchievement,
  getMaskedAchievementInfo,
  calculateUserStats
} = require('../domain/achievementRules');

class AchievementService {
  constructor({ achievementRepository }) {
    this.achievementRepository = achievementRepository;
  }

  /**
   * Get all achievements
   * @param {Object} filters - Optional filters
   * @returns {Array} Achievements
   */
  async getAllAchievements(filters = {}) {
    return runWithContext(async () => {
      try {
        logger.info('Getting all achievements');
        const achievements = await this.achievementRepository.findAllAchievements(filters);
        return achievements;
      } catch (error) {
        logger.error('Failed to get achievements:', error);
        throw error;
      }
    });
  }

  /**
   * Get user's achievements with progress
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Array} User achievements
   */
  async getUserAchievements(userId, filters = {}) {
    return runWithContext(async () => {
      try {
        logger.info(`Getting achievements for user ${userId}`);

        const userAchievements = await this.achievementRepository.getUserAchievements(userId, filters);

        return userAchievements.map(ua => {
          const achievement = ua.achievement;
          const isUnlocked = !!ua.unlocked_at;
          const shouldDisplay = shouldDisplayAchievement(achievement, isUnlocked);

          // Mask secret achievements if not unlocked
          let displayInfo = achievement;
          if (achievement.is_secret && !isUnlocked) {
            displayInfo = { ...achievement, ...getMaskedAchievementInfo(achievement) };
          }

          return {
            ...ua.toJSON(),
            achievement: displayInfo,
            progressPercentage: getAchievementProgressPercentage(ua.progress, achievement.objective_target),
            isUnlocked,
            isClaimed: !!ua.claimed_at,
            shouldDisplay
          };
        }).filter(ua => ua.shouldDisplay);

      } catch (error) {
        logger.error(`Failed to get achievements for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Track achievement objective (called by other services)
   * @param {number} userId - User ID
   * @param {string} objectiveType - Objective type
   * @param {number} value - New value for objective
   * @returns {Array} Unlocked achievements
   */
  async trackAchievementObjective(userId, objectiveType, value) {
    return runWithContext(async () => {
      try {
        logger.info(`Tracking achievement objective for user ${userId}: ${objectiveType} = ${value}`);

        // Get all achievements matching this objective type
        const allAchievements = await this.achievementRepository.findAllAchievements();
        const matchingAchievements = allAchievements.filter(a => a.objective_type === objectiveType);

        if (matchingAchievements.length === 0) {
          return [];
        }

        const unlockedAchievements = [];

        for (const achievement of matchingAchievements) {
          // Get or create user achievement
          const userAchievement = await this.achievementRepository.upsertUserAchievement(
            userId,
            achievement.id,
            value
          );

          // Check if should be unlocked
          if (!userAchievement.unlocked_at && isAchievementUnlocked(userAchievement, achievement)) {
            await this.achievementRepository.markUnlocked(userAchievement.id);
            
            // Reload with achievement data
            const unlocked = await this.achievementRepository.getUserAchievementProgress(userId, achievement.id);
            unlockedAchievements.push(unlocked);
            
            logger.info(`Achievement unlocked for user ${userId}: ${achievement.title}`);
          }
        }

        return unlockedAchievements;

      } catch (error) {
        logger.error(`Failed to track achievement objective:`, error);
        throw error;
      }
    });
  }

  /**
   * Increment achievement progress
   * @param {number} userId - User ID
   * @param {string} objectiveType - Objective type
   * @param {number} increment - Progress increment
   * @returns {Array} Updated/unlocked achievements
   */
  async incrementAchievementProgress(userId, objectiveType, increment = 1) {
    return runWithContext(async () => {
      try {
        logger.info(`Incrementing achievement progress for user ${userId}: ${objectiveType} +${increment}`);

        // Get all achievements matching this objective type
        const allAchievements = await this.achievementRepository.findAllAchievements();
        const matchingAchievements = allAchievements.filter(a => a.objective_type === objectiveType);

        if (matchingAchievements.length === 0) {
          return [];
        }

        const unlockedAchievements = [];

        for (const achievement of matchingAchievements) {
          // Increment progress
          const userAchievement = await this.achievementRepository.incrementProgress(
            userId,
            achievement.id,
            increment
          );

          // Check if should be unlocked
          if (!userAchievement.unlocked_at && isAchievementUnlocked(userAchievement, achievement)) {
            await this.achievementRepository.markUnlocked(userAchievement.id);
            
            // Reload with achievement data
            const unlocked = await this.achievementRepository.getUserAchievementProgress(userId, achievement.id);
            unlockedAchievements.push(unlocked);
            
            logger.info(`Achievement unlocked for user ${userId}: ${achievement.title}`);
          }
        }

        return unlockedAchievements;

      } catch (error) {
        logger.error(`Failed to increment achievement progress:`, error);
        throw error;
      }
    });
  }

  /**
   * Claim achievement rewards
   * @param {number} userId - User ID
   * @param {number} achievementId - Achievement ID
   * @returns {Object} Claimed rewards
   */
  async claimRewards(userId, achievementId) {
    return runWithContext(async () => {
      try {
        logger.info(`User ${userId} claiming rewards for achievement ${achievementId}`);

        // Get user achievement
        const userAchievement = await this.achievementRepository.getUserAchievementProgress(userId, achievementId);
        if (!userAchievement) {
          throw new Error(`Achievement ${achievementId} not found for user ${userId}`);
        }

        // Check if unlocked
        if (!userAchievement.unlocked_at) {
          throw new Error(`Achievement ${achievementId} is not unlocked`);
        }

        // Check if already claimed
        if (userAchievement.claimed_at) {
          throw new Error(`Achievement ${achievementId} rewards already claimed`);
        }

        // Calculate rewards
        const rewards = calculateAchievementRewards(userAchievement.achievement);
        const items = parseRewardItems(userAchievement.achievement.reward_items);

        // Grant rewards to user
        const user = await this.achievementRepository.getUserById(userId);
        
        // Update user resources
        user.or = (user.or || 0) + rewards.or;
        user.metal = (user.metal || 0) + rewards.metal;
        user.carburant = (user.carburant || 0) + rewards.carburant;
        user.xp = (user.xp || 0) + rewards.xp;
        
        // Level up if needed
        const oldLevel = user.level;
        while (user.xp >= user.xp_next_level) {
          user.level += 1;
          user.xp_next_level = Math.floor(user.xp_next_level * 1.5);
        }
        
        // Set title if provided
        if (rewards.title && !user.title) {
          user.title = rewards.title;
        }
        
        await user.save();

        // TODO: Grant items to user inventory (when inventory system is implemented)

        // Mark rewards as claimed
        await this.achievementRepository.markClaimed(userAchievement.id);

        const result = {
          rewards,
          items,
          title: rewards.title,
          points: rewards.points,
          leveledUp: user.level > oldLevel,
          newLevel: user.level
        };

        logger.info(`User ${userId} claimed rewards for achievement ${achievementId}:`, result);
        return result;

      } catch (error) {
        logger.error(`Failed to claim rewards for achievement ${achievementId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Get achievement statistics for user
   * @param {number} userId - User ID
   * @returns {Object} Achievement statistics
   */
  async getUserAchievementStats(userId) {
    return runWithContext(async () => {
      try {
        const stats = await this.achievementRepository.getUserAchievementStats(userId);
        return stats;
      } catch (error) {
        logger.error(`Failed to get achievement stats for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Get achievement leaderboard
   * @param {number} limit - Number of users to return
   * @returns {Array} Leaderboard data
   */
  async getLeaderboard(limit = 100) {
    return runWithContext(async () => {
      try {
        logger.info(`Getting achievement leaderboard (top ${limit})`);
        const leaderboard = await this.achievementRepository.getLeaderboard(limit);
        return leaderboard;
      } catch (error) {
        logger.error('Failed to get achievement leaderboard:', error);
        throw error;
      }
    });
  }
}

module.exports = AchievementService;
