// SequelizeQuestRepository.js - Data access layer for quest system
const { Op } = require('sequelize');

class SequelizeQuestRepository {
  constructor({ Quest, UserQuest, User, sequelize }) {
    this.Quest = Quest;
    this.UserQuest = UserQuest;
    this.User = User;
    this.sequelize = sequelize;
  }

  /**
   * Find active quests by type and optional filters
   * @param {string} type - Quest type (daily, weekly, achievement)
   * @param {Object} options - Optional filters
   * @returns {Array} Quest definitions
   */
  async findActiveQuests(type, options = {}) {
    const where = {
      type,
      is_active: true
    };

    if (options.category) {
      where.category = options.category;
    }

    if (options.minLevel !== undefined) {
      where.min_level = { [Op.lte]: options.minLevel };
    }

    if (options.difficulty) {
      where.difficulty = options.difficulty;
    }

    return this.Quest.findAll({
      where,
      order: [['difficulty', 'ASC'], ['min_level', 'ASC']]
    });
  }

  /**
   * Get quest by ID
   * @param {number} questId - Quest ID
   * @returns {Object|null} Quest definition
   */
  async findQuestById(questId) {
    return this.Quest.findByPk(questId);
  }

  /**
   * Get quest by unique key
   * @param {string} key - Quest key
   * @returns {Object|null} Quest definition
   */
  async findQuestByKey(key) {
    return this.Quest.findOne({ where: { key } });
  }

  /**
   * Get user's quest progress
   * @param {number} userId - User ID
   * @param {number} questId - Quest ID
   * @returns {Object|null} UserQuest instance
   */
  async getUserQuestProgress(userId, questId) {
    return this.UserQuest.findOne({
      where: { user_id: userId, quest_id: questId },
      include: [{ model: this.Quest, as: 'quest' }]
    });
  }

  /**
   * Get all user quests with optional filters
   * @param {number} userId - User ID
   * @param {Object} options - Optional filters
   * @returns {Array} UserQuest instances
   */
  async getUserQuests(userId, options = {}) {
    const where = { user_id: userId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.notExpired) {
      where[Op.or] = [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ];
    }

    const include = [{
      model: this.Quest,
      as: 'quest'
    }];

    // Filter by quest type if provided
    if (options.type) {
      include[0].where = { type: options.type };
    }

    return this.UserQuest.findAll({
      where,
      include,
      order: [['started_at', 'DESC']]
    });
  }

  /**
   * Create user quest assignment
   * @param {number} userId - User ID
   * @param {number} questId - Quest ID
   * @param {Object} options - Additional options
   * @returns {Object} Created UserQuest
   */
  async createUserQuest(userId, questId, options = {}) {
    const data = {
      user_id: userId,
      quest_id: questId,
      status: options.status || 'available',
      progress: options.progress || 0,
      started_at: options.autoStart ? new Date() : null,
      expires_at: options.expiresAt || null
    };

    return this.UserQuest.create(data);
  }

  /**
   * Update quest progress
   * @param {number} userQuestId - UserQuest ID
   * @param {number} progress - New progress value
   * @returns {Object} Updated UserQuest
   */
  async updateProgress(userQuestId, progress) {
    const userQuest = await this.UserQuest.findByPk(userQuestId);
    if (!userQuest) {
      throw new Error(`UserQuest ${userQuestId} not found`);
    }

    userQuest.progress = progress;
    await userQuest.save();

    return userQuest;
  }

  /**
   * Increment quest progress
   * @param {number} userQuestId - UserQuest ID
   * @param {number} increment - Progress increment
   * @returns {Object} Updated UserQuest
   */
  async incrementProgress(userQuestId, increment) {
    const userQuest = await this.UserQuest.findByPk(userQuestId);
    if (!userQuest) {
      throw new Error(`UserQuest ${userQuestId} not found`);
    }

    userQuest.progress = (userQuest.progress || 0) + increment;
    await userQuest.save();

    return userQuest;
  }

  /**
   * Mark quest as started
   * @param {number} userQuestId - UserQuest ID
   * @returns {Object} Updated UserQuest
   */
  async markStarted(userQuestId) {
    const userQuest = await this.UserQuest.findByPk(userQuestId);
    if (!userQuest) {
      throw new Error(`UserQuest ${userQuestId} not found`);
    }

    userQuest.status = 'in_progress';
    userQuest.started_at = new Date();
    await userQuest.save();

    return userQuest;
  }

  /**
   * Mark quest as completed
   * @param {number} userQuestId - UserQuest ID
   * @returns {Object} Updated UserQuest
   */
  async markCompleted(userQuestId) {
    const userQuest = await this.UserQuest.findByPk(userQuestId);
    if (!userQuest) {
      throw new Error(`UserQuest ${userQuestId} not found`);
    }

    userQuest.status = 'completed';
    userQuest.completed_at = new Date();
    await userQuest.save();

    return userQuest;
  }

  /**
   * Mark quest rewards as claimed
   * @param {number} userQuestId - UserQuest ID
   * @returns {Object} Updated UserQuest
   */
  async markClaimed(userQuestId) {
    const userQuest = await this.UserQuest.findByPk(userQuestId);
    if (!userQuest) {
      throw new Error(`UserQuest ${userQuestId} not found`);
    }

    userQuest.status = 'claimed';
    userQuest.claimed_at = new Date();
    await userQuest.save();

    return userQuest;
  }

  /**
   * Delete expired quests
   * @param {Date} beforeDate - Delete quests expired before this date
   * @returns {number} Number of deleted quests
   */
  async deleteExpiredQuests(beforeDate = new Date()) {
    const result = await this.UserQuest.destroy({
      where: {
        expires_at: { [Op.lt]: beforeDate },
        status: { [Op.notIn]: ['completed', 'claimed'] }
      }
    });

    return result;
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} User instance
   */
  async getUserById(userId) {
    return this.User.findByPk(userId);
  }

  /**
   * Get quest statistics for user
   * @param {number} userId - User ID
   * @returns {Object} Quest statistics
   */
  async getUserQuestStats(userId) {
    const stats = await this.UserQuest.findAll({
      attributes: [
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      where: { user_id: userId },
      group: ['status'],
      raw: true
    });

    const statsMap = {
      available: 0,
      in_progress: 0,
      completed: 0,
      claimed: 0
    };

    stats.forEach(stat => {
      statsMap[stat.status] = parseInt(stat.count, 10);
    });

    return statsMap;
  }

  /**
   * Check if user has reached quest limit
   * @param {number} userId - User ID
   * @param {string} questType - Quest type
   * @param {number} maxQuests - Maximum allowed quests
   * @returns {boolean} Whether limit is reached
   */
  async hasReachedQuestLimit(userId, questType, maxQuests) {
    const count = await this.UserQuest.count({
      where: {
        user_id: userId,
        status: { [Op.in]: ['available', 'in_progress'] }
      },
      include: [{
        model: this.Quest,
        as: 'quest',
        where: { type: questType },
        attributes: []
      }]
    });

    return count >= maxQuests;
  }
}

module.exports = SequelizeQuestRepository;
