// QuestService.js - Business logic for quest system
const { logger, runWithContext } = require('../../../utils/logger');
const {
  QUEST_CONSTANTS,
  QUEST_TYPES,
  QUEST_STATUS,
  getNextDailyReset,
  getNextWeeklyReset,
  filterEligibleQuests,
  selectRandomQuests,
  isQuestObjectiveCompleted,
  calculateQuestRewards,
  parseRewardItems,
  isQuestExpired,
  shouldAutoStartQuest,
  isValidProgressIncrement
} = require('../domain/questRules');

class QuestService {
  constructor({ questRepository }) {
    this.questRepository = questRepository;
  }

  /**
   * Assign daily quests to user
   * @param {number} userId - User ID
   * @returns {Array} Assigned daily quests
   */
  async assignDailyQuests(userId) {
    return runWithContext(async () => {
      try {
        logger.info(`Assigning daily quests to user ${userId}`);

        // Get user
        const user = await this.questRepository.getUserById(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Check if user has reached daily quest limit
        const hasLimit = await this.questRepository.hasReachedQuestLimit(
          userId,
          QUEST_TYPES.DAILY,
          QUEST_CONSTANTS.MAX_DAILY_QUESTS
        );

        if (hasLimit) {
          logger.info(`User ${userId} already has maximum daily quests`);
          return [];
        }

        // Get active daily quests
        const dailyQuests = await this.questRepository.findActiveQuests(QUEST_TYPES.DAILY);

        // Get user's existing quests
        const existingQuests = await this.questRepository.getUserQuests(userId, {
          type: QUEST_TYPES.DAILY,
          notExpired: true
        });

        // Filter eligible quests
        const eligibleQuests = filterEligibleQuests(dailyQuests, user, existingQuests);

        if (eligibleQuests.length === 0) {
          logger.info(`No eligible daily quests for user ${userId}`);
          return [];
        }

        // Calculate how many quests to assign
        const currentCount = existingQuests.length;
        const toAssign = Math.min(
          QUEST_CONSTANTS.MAX_DAILY_QUESTS - currentCount,
          eligibleQuests.length
        );

        // Select random quests
        const selectedQuests = selectRandomQuests(eligibleQuests, toAssign);

        // Calculate expiration time
        const expiresAt = getNextDailyReset();

        // Assign quests to user
        const assignedQuests = [];
        for (const quest of selectedQuests) {
          const userQuest = await this.questRepository.createUserQuest(userId, quest.id, {
            status: QUEST_STATUS.IN_PROGRESS,
            autoStart: true,
            expiresAt
          });

          assignedQuests.push({
            ...userQuest.toJSON(),
            quest: quest.toJSON()
          });
        }

        logger.info(`Assigned ${assignedQuests.length} daily quests to user ${userId}`);
        return assignedQuests;

      } catch (error) {
        logger.error(`Failed to assign daily quests to user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Assign weekly quests to user
   * @param {number} userId - User ID
   * @returns {Array} Assigned weekly quests
   */
  async assignWeeklyQuests(userId) {
    return runWithContext(async () => {
      try {
        logger.info(`Assigning weekly quests to user ${userId}`);

        // Get user
        const user = await this.questRepository.getUserById(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Check if user has reached weekly quest limit
        const hasLimit = await this.questRepository.hasReachedQuestLimit(
          userId,
          QUEST_TYPES.WEEKLY,
          QUEST_CONSTANTS.MAX_WEEKLY_QUESTS
        );

        if (hasLimit) {
          logger.info(`User ${userId} already has maximum weekly quests`);
          return [];
        }

        // Get active weekly quests
        const weeklyQuests = await this.questRepository.findActiveQuests(QUEST_TYPES.WEEKLY);

        // Get user's existing quests
        const existingQuests = await this.questRepository.getUserQuests(userId, {
          type: QUEST_TYPES.WEEKLY,
          notExpired: true
        });

        // Filter eligible quests
        const eligibleQuests = filterEligibleQuests(weeklyQuests, user, existingQuests);

        if (eligibleQuests.length === 0) {
          logger.info(`No eligible weekly quests for user ${userId}`);
          return [];
        }

        // Calculate how many quests to assign
        const currentCount = existingQuests.length;
        const toAssign = Math.min(
          QUEST_CONSTANTS.MAX_WEEKLY_QUESTS - currentCount,
          eligibleQuests.length
        );

        // Select random quests
        const selectedQuests = selectRandomQuests(eligibleQuests, toAssign);

        // Calculate expiration time
        const expiresAt = getNextWeeklyReset();

        // Assign quests to user
        const assignedQuests = [];
        for (const quest of selectedQuests) {
          const userQuest = await this.questRepository.createUserQuest(userId, quest.id, {
            status: QUEST_STATUS.IN_PROGRESS,
            autoStart: true,
            expiresAt
          });

          assignedQuests.push({
            ...userQuest.toJSON(),
            quest: quest.toJSON()
          });
        }

        logger.info(`Assigned ${assignedQuests.length} weekly quests to user ${userId}`);
        return assignedQuests;

      } catch (error) {
        logger.error(`Failed to assign weekly quests to user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Get all quests for user
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Array} User quests
   */
  async getUserQuests(userId, filters = {}) {
    return runWithContext(async () => {
      try {
        logger.info(`Getting quests for user ${userId}`);

        const options = {
          notExpired: filters.includeExpired !== true
        };

        if (filters.type) {
          options.type = filters.type;
        }

        if (filters.status) {
          options.status = filters.status;
        }

        const userQuests = await this.questRepository.getUserQuests(userId, options);

        return userQuests.map(uq => ({
          ...uq.toJSON(),
          progressPercentage: Math.round((uq.progress / uq.quest.objective_target) * 100),
          isExpired: isQuestExpired(uq),
          isCompleted: isQuestObjectiveCompleted(uq, uq.quest)
        }));

      } catch (error) {
        logger.error(`Failed to get quests for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Start a quest manually (for achievements)
   * @param {number} userId - User ID
   * @param {number} questId - Quest ID
   * @returns {Object} Updated user quest
   */
  async startQuest(userId, questId) {
    return runWithContext(async () => {
      try {
        logger.info(`User ${userId} starting quest ${questId}`);

        // Get user quest
        const userQuest = await this.questRepository.getUserQuestProgress(userId, questId);
        if (!userQuest) {
          throw new Error(`Quest ${questId} not assigned to user ${userId}`);
        }

        // Check if already started
        if (userQuest.status !== QUEST_STATUS.AVAILABLE) {
          throw new Error(`Quest ${questId} is not available to start (status: ${userQuest.status})`);
        }

        // Check if expired
        if (isQuestExpired(userQuest)) {
          throw new Error(`Quest ${questId} has expired`);
        }

        // Mark as started
        const updated = await this.questRepository.markStarted(userQuest.id);

        logger.info(`User ${userId} started quest ${questId}`);
        return updated;

      } catch (error) {
        logger.error(`Failed to start quest ${questId} for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Update quest progress
   * @param {number} userId - User ID
   * @param {number} questId - Quest ID
   * @param {number} increment - Progress increment
   * @returns {Object} Updated user quest
   */
  async updateQuestProgress(userId, questId, increment) {
    return runWithContext(async () => {
      try {
        logger.info(`Updating quest ${questId} progress for user ${userId} by ${increment}`);

        // Get user quest
        const userQuest = await this.questRepository.getUserQuestProgress(userId, questId);
        if (!userQuest) {
          logger.warn(`Quest ${questId} not found for user ${userId}`);
          return null;
        }

        // Validate increment
        if (!isValidProgressIncrement(userQuest, increment)) {
          logger.warn(`Invalid progress increment for quest ${questId}`);
          return null;
        }

        // Update progress
        const newProgress = Math.min(
          userQuest.progress + increment,
          userQuest.quest.objective_target
        );
        const updated = await this.questRepository.updateProgress(userQuest.id, newProgress);

        // Check if completed
        if (isQuestObjectiveCompleted(updated, userQuest.quest)) {
          const completed = await this.questRepository.markCompleted(updated.id);
          logger.info(`Quest ${questId} completed for user ${userId}`);
          return completed;
        }

        return updated;

      } catch (error) {
        logger.error(`Failed to update quest progress:`, error);
        throw error;
      }
    });
  }

  /**
   * Claim quest rewards
   * @param {number} userId - User ID
   * @param {number} questId - Quest ID
   * @returns {Object} Claimed rewards
   */
  async claimRewards(userId, questId) {
    return runWithContext(async () => {
      try {
        logger.info(`User ${userId} claiming rewards for quest ${questId}`);

        // Get user quest
        const userQuest = await this.questRepository.getUserQuestProgress(userId, questId);
        if (!userQuest) {
          throw new Error(`Quest ${questId} not assigned to user ${userId}`);
        }

        // Check if completed
        if (userQuest.status !== QUEST_STATUS.COMPLETED) {
          throw new Error(`Quest ${questId} is not completed (status: ${userQuest.status})`);
        }

        // Check if expired
        if (isQuestExpired(userQuest)) {
          throw new Error(`Quest ${questId} has expired`);
        }

        // Calculate rewards
        const rewards = calculateQuestRewards(userQuest.quest);
        const items = parseRewardItems(userQuest.quest.reward_items);

        // Grant rewards to user
        const user = await this.questRepository.getUserById(userId);
        
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
        
        await user.save();

        // TODO: Grant items to user inventory (when inventory system is implemented)

        // Mark rewards as claimed
        await this.questRepository.markClaimed(userQuest.id);

        // TODO: Grant Battle Pass XP (requires BattlePassService integration)
        // const battlePassService = require('../../battlepass/application/BattlePassService');
        // if (battlePassService && typeof battlePassService.addXP === 'function') {
        //   battlePassService.addXP(userId, 50)
        //     .catch(err => logger.error(`Failed to grant Battle Pass XP for quest ${questId}:`, err));
        // }
        
        // TODO: Check for achievement unlocks (requires achievementChecker integration)
        // const achievementChecker = require('../../../utils/achievementChecker');
        // if (achievementChecker && typeof achievementChecker.checkQuestAchievements === 'function') {
        //   achievementChecker.checkQuestAchievements(userId)
        //     .catch(err => logger.error('Failed to check quest achievements:', err));
        // }
        
        // // Check for level achievements if user leveled up
        // if (user.level > oldLevel && achievementChecker && typeof achievementChecker.checkLevelAchievements === 'function') {
        //   achievementChecker.checkLevelAchievements(userId, user.level)
        //     .catch(err => logger.error('Failed to check level achievements:', err));
        // }

        const result = {
          rewards,
          items,
          leveledUp: user.level > oldLevel,
          newLevel: user.level
        };

        logger.info(`User ${userId} claimed rewards for quest ${questId}:`, result);
        return result;

      } catch (error) {
        logger.error(`Failed to claim rewards for quest ${questId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Reset expired quests (cron job)
   * @returns {Object} Reset statistics
   */
  async resetExpiredQuests() {
    return runWithContext(async () => {
      try {
        logger.info('Resetting expired quests');

        const deletedCount = await this.questRepository.deleteExpiredQuests();

        logger.info(`Reset ${deletedCount} expired quests`);
        return { deletedCount };

      } catch (error) {
        logger.error('Failed to reset expired quests:', error);
        throw error;
      }
    });
  }

  /**
   * Track quest objective event (called by other services)
   * @param {number} userId - User ID
   * @param {string} objectiveType - Objective type
   * @param {Object} data - Event data
   * @returns {Array} Updated quests
   */
  async trackQuestObjective(userId, objectiveType, data = {}) {
    return runWithContext(async () => {
      try {
        logger.info(`Tracking quest objective for user ${userId}: ${objectiveType}`);

        // Get user's active quests
        const userQuests = await this.questRepository.getUserQuests(userId, {
          status: QUEST_STATUS.IN_PROGRESS,
          notExpired: true
        });

        // Filter quests matching this objective type
        const matchingQuests = userQuests.filter(uq => 
          uq.quest.objective_type === objectiveType
        );

        if (matchingQuests.length === 0) {
          return [];
        }

        // Update each matching quest
        const updatedQuests = [];
        for (const userQuest of matchingQuests) {
          // Calculate increment based on objective data
          const increment = this._calculateIncrement(userQuest.quest, data);
          
          if (increment > 0) {
            const updated = await this.updateQuestProgress(
              userId,
              userQuest.quest_id,
              increment
            );
            
            if (updated) {
              updatedQuests.push(updated);
            }
          }
        }

        return updatedQuests;

      } catch (error) {
        logger.error(`Failed to track quest objective:`, error);
        throw error;
      }
    });
  }

  /**
   * Calculate increment based on objective data
   * @private
   */
  _calculateIncrement(quest, data) {
    // Parse objective_data if string
    let objectiveData = quest.objective_data;
    if (typeof objectiveData === 'string') {
      try {
        objectiveData = JSON.parse(objectiveData);
      } catch (err) {
        objectiveData = {};
      }
    }

    // Match specific resource/unit type if specified
    if (objectiveData.resource_type && data.resource_type !== objectiveData.resource_type) {
      return 0;
    }

    if (objectiveData.unit_type && data.unit_type !== objectiveData.unit_type) {
      return 0;
    }

    if (objectiveData.building_type && data.building_type !== objectiveData.building_type) {
      return 0;
    }

    // Return amount or default to 1
    return data.amount || 1;
  }

  /**
   * Get quest statistics for user
   * @param {number} userId - User ID
   * @returns {Object} Quest statistics
   */
  async getUserQuestStats(userId) {
    return runWithContext(async () => {
      try {
        const stats = await this.questRepository.getUserQuestStats(userId);
        return stats;
      } catch (error) {
        logger.error(`Failed to get quest stats for user ${userId}:`, error);
        throw error;
      }
    });
  }
}

module.exports = QuestService;
