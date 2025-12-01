/**
 * QuestRepository
 * Data access layer for quest system
 */

const { Op } = require('sequelize');

module.exports = ({ models, logger, traceId }) => {
  const {
    PortalQuest,
    UserQuest,
    UserQuestUnlock,
    DailyQuestRotation,
    QuestStreak,
    User,
  } = models;

  return {
    // ============================================
    // PORTAL QUEST (Master Quest Definitions)
    // ============================================

    async findQuestById(questId) {
      return await PortalQuest.findByPk(questId);
    },

    async findQuestsByType(questType, options = {}) {
      const where = { quest_type: questType, is_active: true };
      
      if (options.required_level) {
        where.required_level = { [Op.lte]: options.required_level };
      }
      
      return await PortalQuest.findAll({
        where,
        order: [['chapter', 'ASC'], ['order_in_chapter', 'ASC']],
      });
    },

    async findStoryQuestsByChapter(chapter) {
      return await PortalQuest.findAll({
        where: {
          quest_type: 'story',
          chapter,
          is_active: true,
        },
        order: [['order_in_chapter', 'ASC']],
      });
    },

    async findAllActiveQuests() {
      return await PortalQuest.findAll({
        where: { is_active: true },
        order: [['quest_type', 'ASC'], ['chapter', 'ASC'], ['order_in_chapter', 'ASC']],
      });
    },

    async createQuest(questData) {
      return await PortalQuest.create(questData);
    },

    async updateQuest(questId, updates) {
      const quest = await PortalQuest.findByPk(questId);
      if (!quest) throw new Error(`Quest ${questId} not found`);
      
      return await quest.update(updates);
    },

    // ============================================
    // USER QUEST (Player Progress)
    // ============================================

    async findUserQuestById(userQuestId) {
      return await UserQuest.findByPk(userQuestId, {
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
      });
    },

    async findUserQuest(userId, questId) {
      return await UserQuest.findOne({
        where: { user_id: userId, quest_id: questId },
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
      });
    },

    async findUserQuestsByStatus(userId, status) {
      return await UserQuest.findAll({
        where: { user_id: userId, status },
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
        order: [['started_at', 'DESC']],
      });
    },

    async findActiveUserQuests(userId) {
      return await UserQuest.findAll({
        where: {
          user_id: userId,
          status: 'in_progress',
        },
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
        order: [['started_at', 'ASC']],
      });
    },

    async findExpiredUserQuests(userId) {
      return await UserQuest.findAll({
        where: {
          user_id: userId,
          status: 'in_progress',
          expires_at: { [Op.lt]: new Date() },
        },
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
      });
    },

    async createUserQuest(userId, questId, expiresAt = null) {
      // Get quest to initialize progress
      const quest = await PortalQuest.findByPk(questId);
      if (!quest) throw new Error(`Quest ${questId} not found`);

      const progress = quest.objectives.map(obj => ({
        type: obj.type,
        target: obj.target,
        current: 0,
        description: obj.description,
      }));

      return await UserQuest.create({
        user_id: userId,
        quest_id: questId,
        status: 'in_progress',
        progress,
        started_at: new Date(),
        expires_at: expiresAt,
      });
    },

    async updateUserQuestProgress(userQuestId, progressUpdates) {
      const userQuest = await UserQuest.findByPk(userQuestId);
      if (!userQuest) throw new Error(`UserQuest ${userQuestId} not found`);

      userQuest.progress = progressUpdates;
      userQuest.changed('progress', true);
      await userQuest.save();

      return userQuest;
    },

    async markUserQuestCompleted(userQuestId) {
      const userQuest = await UserQuest.findByPk(userQuestId);
      if (!userQuest) throw new Error(`UserQuest ${userQuestId} not found`);

      userQuest.status = 'completed';
      userQuest.completed_at = new Date();
      await userQuest.save();

      return userQuest;
    },

    async markUserQuestAbandoned(userQuestId) {
      const userQuest = await UserQuest.findByPk(userQuestId);
      if (!userQuest) throw new Error(`UserQuest ${userQuestId} not found`);

      userQuest.status = 'abandoned';
      await userQuest.save();

      return userQuest;
    },

    async markRewardsClaimed(userQuestId) {
      const userQuest = await UserQuest.findByPk(userQuestId);
      if (!userQuest) throw new Error(`UserQuest ${userQuestId} not found`);

      userQuest.status = 'claimed';
      userQuest.claimed_at = new Date();
      await userQuest.save();

      return userQuest;
    },

    // ============================================
    // USER QUEST UNLOCK (Content Unlocks)
    // ============================================

    async findUserUnlock(userId, unlockType, unlockKey) {
      return await UserQuestUnlock.findOne({
        where: {
          user_id: userId,
          unlock_type: unlockType,
          unlock_key: unlockKey,
        },
      });
    },

    async findUserUnlocks(userId, unlockType = null) {
      const where = { user_id: userId };
      if (unlockType) {
        where.unlock_type = unlockType;
      }

      return await UserQuestUnlock.findAll({
        where,
        include: [
          { model: PortalQuest, as: 'quest' },
        ],
        order: [['unlocked_at', 'DESC']],
      });
    },

    async createUnlock(userId, unlockType, unlockKey, questId) {
      // Check if already unlocked
      const existing = await this.findUserUnlock(userId, unlockType, unlockKey);
      if (existing) {
        return existing;
      }

      return await UserQuestUnlock.create({
        user_id: userId,
        unlock_type: unlockType,
        unlock_key: unlockKey,
        unlocked_by_quest_id: questId,
        unlocked_at: new Date(),
      });
    },

    async hasUnlock(userId, unlockType, unlockKey) {
      const unlock = await this.findUserUnlock(userId, unlockType, unlockKey);
      return !!unlock;
    },

    // ============================================
    // DAILY QUEST ROTATION
    // ============================================

    async getDailyRotation(date) {
      return await DailyQuestRotation.findOne({
        where: { date },
      });
    },

    async getTodayRotation() {
      const today = new Date().toISOString().split('T')[0];
      return await this.getDailyRotation(today);
    },

    async createDailyRotation(date, questIds) {
      return await DailyQuestRotation.create({
        date,
        quest_ids: questIds,
        created_at: new Date(),
      });
    },

    // ============================================
    // QUEST STREAK
    // ============================================

    async getStreak(userId) {
      return await QuestStreak.findByPk(userId);
    },

    async createStreak(userId) {
      return await QuestStreak.create({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: null,
      });
    },

    async getOrCreateStreak(userId) {
      let streak = await this.getStreak(userId);
      if (!streak) {
        streak = await this.createStreak(userId);
      }
      return streak;
    },

    async updateStreak(userId, updates) {
      const streak = await this.getOrCreateStreak(userId);
      return await streak.update(updates);
    },

    async incrementStreak(userId) {
      const streak = await this.getOrCreateStreak(userId);
      
      // Check if should reset
      if (streak.shouldResetStreak()) {
        streak.resetStreak();
      }

      // Check if can increment today
      if (!streak.canIncrementToday()) {
        throw new Error('Streak already incremented today');
      }

      streak.incrementStreak();
      await streak.save();

      return streak;
    },

    async resetStreak(userId) {
      const streak = await this.getOrCreateStreak(userId);
      streak.resetStreak();
      await streak.save();
      return streak;
    },

    // ============================================
    // STATISTICS & ANALYTICS
    // ============================================

    async getUserQuestStats(userId) {
      const [total, active, completed] = await Promise.all([
        UserQuest.count({ where: { user_id: userId } }),
        UserQuest.count({ where: { user_id: userId, status: 'in_progress' } }),
        UserQuest.count({ where: { user_id: userId, status: 'completed' } }),
      ]);

      return { total, active, completed, abandoned: total - active - completed };
    },

    async getQuestCompletionRate(questId) {
      const [total, completed] = await Promise.all([
        UserQuest.count({ where: { quest_id: questId } }),
        UserQuest.count({ where: { quest_id: questId, status: 'completed' } }),
      ]);

      return total > 0 ? (completed / total) * 100 : 0;
    },
  };
};
