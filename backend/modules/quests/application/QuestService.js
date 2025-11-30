/**
 * QuestService
 * Business logic for quest system
 */

module.exports = ({ questRepository, logger, traceId }) => {
  return {
    // ============================================
    // QUEST ASSIGNMENT & LIFECYCLE
    // ============================================

    async getAvailableQuests(userId, userLevel, masteryTier) {
      logger.info({ traceId, userId, userLevel, masteryTier }, 'Getting available quests');

      // Get all active quests
      const allQuests = await questRepository.findAllActiveQuests();

      // Get user's active and completed quests
      const [activeQuests, completedQuests] = await Promise.all([
        questRepository.findActiveUserQuests(userId),
        questRepository.findUserQuestsByStatus(userId, 'completed'),
      ]);

      const activeQuestIds = new Set(activeQuests.map(uq => uq.quest_id));
      const completedQuestIds = new Set(completedQuests.map(uq => uq.quest_id));

      // Filter available quests
      const available = allQuests.filter(quest => {
        // Skip if already active or completed
        if (activeQuestIds.has(quest.quest_id)) return false;
        if (completedQuestIds.has(quest.quest_id) && !quest.isRepeatable()) return false;

        // Check level requirement
        if (quest.required_level && userLevel < quest.required_level) return false;

        // Check mastery requirement
        if (quest.required_mastery_tier && masteryTier < quest.required_mastery_tier) return false;

        // Check prerequisite
        if (quest.hasPrerequisite()) {
          if (!completedQuestIds.has(quest.prerequisite_quest_id)) return false;
        }

        return true;
      });

      return available;
    },

    async acceptQuest(userId, questId) {
      logger.info({ traceId, userId, questId }, 'Accepting quest');

      // Check if already accepted
      const existing = await questRepository.findUserQuest(userId, questId);
      if (existing && existing.isActive()) {
        throw new Error('Quest already active');
      }

      // Get quest details
      const quest = await questRepository.findQuestById(questId);
      if (!quest || !quest.is_active) {
        throw new Error('Quest not available');
      }

      // Determine expiration for repeatable quests
      let expiresAt = null;
      if (quest.quest_type === 'daily') {
        const tomorrow = new Date();
        tomorrow.setUTCHours(23, 59, 59, 999);
        expiresAt = tomorrow;
      } else if (quest.quest_type === 'weekly') {
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7);
        nextMonday.setUTCHours(23, 59, 59, 999);
        expiresAt = nextMonday;
      }

      // Create user quest
      const userQuest = await questRepository.createUserQuest(userId, questId, expiresAt);

      logger.info({ traceId, userQuestId: userQuest.user_quest_id }, 'Quest accepted');

      return userQuest;
    },

    async abandonQuest(userId, questId) {
      logger.info({ traceId, userId, questId }, 'Abandoning quest');

      const userQuest = await questRepository.findUserQuest(userId, questId);
      if (!userQuest) {
        throw new Error('Quest not found');
      }

      if (!userQuest.isActive()) {
        throw new Error('Quest is not active');
      }

      await questRepository.markUserQuestAbandoned(userQuest.user_quest_id);

      logger.info({ traceId, userQuestId: userQuest.user_quest_id }, 'Quest abandoned');

      return userQuest;
    },

    // ============================================
    // QUEST PROGRESS TRACKING
    // ============================================

    async updateQuestProgress(userId, objectiveType, value = 1, metadata = {}) {
      logger.info({ traceId, userId, objectiveType, value }, 'Updating quest progress');

      // Get all active user quests
      const activeQuests = await questRepository.findActiveUserQuests(userId);

      const updatedQuests = [];

      for (const userQuest of activeQuests) {
        let progressUpdated = false;

        // Update progress for matching objectives
        userQuest.progress.forEach((objective, index) => {
          if (objective.type === objectiveType) {
            // Check metadata filters if any
            const quest = userQuest.quest;
            const questObjective = quest.objectives[index];

            // Apply filters (e.g., portal_tier, boss_type)
            if (questObjective.filters) {
              const filtersMatch = Object.entries(questObjective.filters).every(
                ([key, expectedValue]) => metadata[key] === expectedValue
              );
              if (!filtersMatch) return;
            }

            // Increment progress
            objective.current = Math.min(objective.current + value, objective.target);
            progressUpdated = true;
          }
        });

        if (progressUpdated) {
          // Save progress
          await questRepository.updateUserQuestProgress(
            userQuest.user_quest_id,
            userQuest.progress
          );

          // Check if quest is now complete
          if (userQuest.getAllObjectivesComplete()) {
            await questRepository.markUserQuestCompleted(userQuest.user_quest_id);
            updatedQuests.push({ ...userQuest.toJSON(), completed: true });
          } else {
            updatedQuests.push({ ...userQuest.toJSON(), completed: false });
          }
        }
      }

      logger.info({ traceId, updatedCount: updatedQuests.length }, 'Quest progress updated');

      return updatedQuests;
    },

    async checkQuestCompletion(userQuestId) {
      const userQuest = await questRepository.findUserQuestById(userQuestId);
      if (!userQuest) {
        throw new Error('Quest not found');
      }

      const isComplete = userQuest.getAllObjectivesComplete();

      if (isComplete && userQuest.status === 'active') {
        await questRepository.markUserQuestCompleted(userQuestId);
      }

      return isComplete;
    },

    // ============================================
    // QUEST REWARDS
    // ============================================

    async claimRewards(userId, questId) {
      logger.info({ traceId, userId, questId }, 'Claiming quest rewards');

      const userQuest = await questRepository.findUserQuest(userId, questId);
      if (!userQuest) {
        throw new Error('Quest not found');
      }

      if (!userQuest.canClaimRewards()) {
        throw new Error('Cannot claim rewards - quest not completed or already claimed');
      }

      const quest = userQuest.quest;
      const rewards = quest.rewards || {};

      // Get streak bonus for daily quests
      let streakBonus = 1.0;
      if (quest.quest_type === 'daily') {
        const streak = await questRepository.getOrCreateStreak(userId);
        streakBonus = 1 + streak.getStreakBonus();
      }

      // Calculate final rewards with streak bonus
      const finalRewards = {
        gold: Math.floor((rewards.gold || 0) * streakBonus),
        experience: Math.floor((rewards.experience || 0) * streakBonus),
        units: rewards.units || {},
        blueprints: rewards.blueprints || [],
        unlocks: rewards.unlocks || [],
        titles: rewards.titles || [],
        cosmetics: rewards.cosmetics || [],
      };

      // Process unlocks
      for (const unlock of finalRewards.unlocks) {
        await questRepository.createUnlock(
          userId,
          unlock.type,
          unlock.key,
          quest.quest_id
        );
      }

      // Mark rewards as claimed
      await questRepository.markRewardsClaimed(userQuest.user_quest_id);

      // Increment streak for daily quests
      if (quest.quest_type === 'daily') {
        try {
          await questRepository.incrementStreak(userId);
        } catch (error) {
          logger.warn({ traceId, error: error.message }, 'Failed to increment streak');
        }
      }

      logger.info({ traceId, rewards: finalRewards }, 'Rewards claimed');

      return {
        rewards: finalRewards,
        streakBonus,
        userQuest,
      };
    },

    // ============================================
    // DAILY/WEEKLY QUEST ROTATION
    // ============================================

    async rotateDailyQuests() {
      logger.info({ traceId }, 'Rotating daily quests');

      const today = new Date().toISOString().split('T')[0];

      // Check if already rotated today
      const existingRotation = await questRepository.getDailyRotation(today);
      if (existingRotation) {
        logger.info({ traceId }, 'Daily quests already rotated today');
        return existingRotation;
      }

      // Get all daily quests
      const dailyQuests = await questRepository.findQuestsByType('daily');

      if (dailyQuests.length < 3) {
        throw new Error('Not enough daily quests available');
      }

      // Randomly select 3 quests
      const shuffled = dailyQuests.sort(() => Math.random() - 0.5);
      const selectedQuests = shuffled.slice(0, 3);
      const questIds = selectedQuests.map(q => q.quest_id);

      // Create rotation
      const rotation = await questRepository.createDailyRotation(today, questIds);

      logger.info({ traceId, questIds }, 'Daily quests rotated');

      return rotation;
    },

    async getDailyQuests(userId) {
      const rotation = await questRepository.getTodayRotation();
      if (!rotation) {
        throw new Error('No daily quests available');
      }

      // Get quests
      const quests = await Promise.all(
        rotation.quest_ids.map(id => questRepository.findQuestById(id))
      );

      // Get user quest status
      const userQuests = await Promise.all(
        rotation.quest_ids.map(id => questRepository.findUserQuest(userId, id))
      );

      return quests.map((quest, index) => ({
        ...quest.toJSON(),
        userQuest: userQuests[index]?.toJSON() || null,
      }));
    },

    // ============================================
    // UNLOCKS
    // ============================================

    async getUserUnlocks(userId) {
      return await questRepository.findUserUnlocks(userId);
    },

    async hasUnlock(userId, unlockType, unlockKey) {
      return await questRepository.hasUnlock(userId, unlockType, unlockKey);
    },

    async getPortalTierUnlocks(userId) {
      return await questRepository.findUserUnlocks(userId, 'portal_tier');
    },

    // ============================================
    // STREAKS
    // ============================================

    async getStreak(userId) {
      return await questRepository.getOrCreateStreak(userId);
    },

    // ============================================
    // STORY PROGRESSION
    // ============================================

    async getStoryProgress(userId) {
      const storyQuests = await questRepository.findQuestsByType('story');
      const userQuests = await questRepository.findUserQuestsByStatus(userId, 'completed');
      const completedQuestIds = new Set(userQuests.map(uq => uq.quest_id));

      // Group by chapter
      const chapters = {};
      storyQuests.forEach(quest => {
        if (!chapters[quest.chapter]) {
          chapters[quest.chapter] = { quests: [], completed: 0, total: 0 };
        }
        chapters[quest.chapter].quests.push(quest);
        chapters[quest.chapter].total += 1;
        if (completedQuestIds.has(quest.quest_id)) {
          chapters[quest.chapter].completed += 1;
        }
      });

      return chapters;
    },

    async getCurrentChapter(userId) {
      const progress = await this.getStoryProgress(userId);

      for (const [chapter, data] of Object.entries(progress)) {
        if (data.completed < data.total) {
          return parseInt(chapter);
        }
      }

      // All chapters complete
      return Object.keys(progress).length;
    },

    async getNextStoryQuest(userId) {
      const currentChapter = await this.getCurrentChapter(userId);
      const chapterQuests = await questRepository.findStoryQuestsByChapter(currentChapter);
      const completedQuests = await questRepository.findUserQuestsByStatus(userId, 'completed');
      const completedQuestIds = new Set(completedQuests.map(uq => uq.quest_id));

      // Find first incomplete quest in chapter
      const nextQuest = chapterQuests.find(q => !completedQuestIds.has(q.quest_id));

      return nextQuest || null;
    },

    // ============================================
    // STATISTICS
    // ============================================

    async getUserQuestStats(userId) {
      return await questRepository.getUserQuestStats(userId);
    },

    // ============================================
    // CRON JOB METHODS
    // ============================================

    /**
     * Rotate daily quests for all users
     * Called by cron job at midnight UTC
     */
    async rotateDailyQuests() {
      logger.info({ traceId }, 'Starting daily quest rotation');

      const errors = [];
      let usersRotated = 0;

      try {
        // Get all users with active daily quests
        const activeUsers = await questRepository.getUsersWithActiveQuests('daily');

        for (const user of activeUsers) {
          try {
            // Mark expired daily quests as failed
            await questRepository.markExpiredQuests(user.user_id, 'daily');

            // Check if user completed all daily quests yesterday
            const yesterdayCompleted = await questRepository.countCompletedQuestsToday(user.user_id, 'daily');

            if (yesterdayCompleted >= 3) {
              // Increment streak
              await questRepository.incrementStreak(user.user_id);
            } else {
              // Reset streak
              await questRepository.resetStreak(user.user_id);
            }

            usersRotated++;
          } catch (error) {
            logger.error({ traceId, userId: user.user_id, error }, 'Failed to rotate daily quests for user');
            errors.push({ userId: user.user_id, error: error.message });
          }
        }

        logger.info({ traceId, usersRotated, errors: errors.length }, 'Daily quest rotation complete');

        return { usersRotated, errors };
      } catch (error) {
        logger.error({ traceId, error }, 'Daily quest rotation failed');
        throw error;
      }
    },

    /**
     * Rotate weekly quests for all users
     * Called by cron job every Monday at midnight UTC
     */
    async rotateWeeklyQuests() {
      logger.info({ traceId }, 'Starting weekly quest rotation');

      const errors = [];
      let usersRotated = 0;

      try {
        // Get all users with active weekly quests
        const activeUsers = await questRepository.getUsersWithActiveQuests('weekly');

        for (const user of activeUsers) {
          try {
            // Mark expired weekly quests as failed
            await questRepository.markExpiredQuests(user.user_id, 'weekly');

            usersRotated++;
          } catch (error) {
            logger.error({ traceId, userId: user.user_id, error }, 'Failed to rotate weekly quests for user');
            errors.push({ userId: user.user_id, error: error.message });
          }
        }

        logger.info({ traceId, usersRotated, errors: errors.length }, 'Weekly quest rotation complete');

        return { usersRotated, errors };
      } catch (error) {
        logger.error({ traceId, error }, 'Weekly quest rotation failed');
        throw error;
      }
    },

    /**
     * Cleanup expired quests
     * Called hourly by cron job
     */
    async cleanupExpiredQuests() {
      logger.info({ traceId }, 'Starting expired quest cleanup');

      try {
        // Mark all expired quests as failed
        const expired = await questRepository.markAllExpiredQuests();

        // Clean up stale quest progress (progress for non-active quests)
        const cleaned = await questRepository.cleanupStaleQuestProgress();

        logger.info({ traceId, expired, cleaned }, 'Expired quest cleanup complete');

        return { expired, cleaned };
      } catch (error) {
        logger.error({ traceId, error }, 'Expired quest cleanup failed');
        throw error;
      }
    },

    /**
     * Check and reset streaks for users who missed daily completions
     * Called every 6 hours by cron job
     */
    async checkAndResetStreaks() {
      logger.info({ traceId }, 'Starting streak reset check');

      try {
        // Get all users with active streaks
        const usersWithStreaks = await questRepository.getUsersWithActiveStreaks();

        let reset = 0;

        for (const user of usersWithStreaks) {
          // Check if user completed daily quests yesterday
          const yesterdayCompleted = await questRepository.countCompletedQuestsYesterday(user.user_id, 'daily');

          if (yesterdayCompleted < 3) {
            // Reset streak
            await questRepository.resetStreak(user.user_id);
            reset++;
          }
        }

        logger.info({ traceId, reset }, 'Streak reset check complete');

        return { reset };
      } catch (error) {
        logger.error({ traceId, error }, 'Streak reset check failed');
        throw error;
      }
    },

    /**
     * Archive old quest progress
     * Called daily by cron job
     */
    async archiveOldQuestProgress(daysOld = 30) {
      logger.info({ traceId, daysOld }, 'Starting quest progress archival');

      try {
        const archived = await questRepository.archiveOldQuestProgress(daysOld);

        logger.info({ traceId, archived }, 'Quest progress archival complete');

        return { archived };
      } catch (error) {
        logger.error({ traceId, error }, 'Quest progress archival failed');
        throw error;
      }
    },
  };
};
