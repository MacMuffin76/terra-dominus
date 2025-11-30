// SequelizeAchievementRepository.js - Data access layer for achievement system
const { Op } = require('sequelize');

class SequelizeAchievementRepository {
  constructor({ Achievement, UserAchievement, User, sequelize }) {
    this.Achievement = Achievement;
    this.UserAchievement = UserAchievement;
    this.User = User;
    this.sequelize = sequelize;
  }

  /**
   * Find all active achievements
   * @param {Object} options - Optional filters
   * @returns {Array} Achievement definitions
   */
  async findAllAchievements(options = {}) {
    const where = { is_active: true };

    if (options.category) {
      where.category = options.category;
    }

    if (options.tier) {
      where.tier = options.tier;
    }

    if (options.includeSecret === false) {
      where.is_secret = false;
    }

    return this.Achievement.findAll({
      where,
      order: [['tier', 'DESC'], ['points', 'DESC']]
    });
  }

  /**
   * Get achievement by ID
   * @param {number} achievementId - Achievement ID
   * @returns {Object|null} Achievement definition
   */
  async findAchievementById(achievementId) {
    return this.Achievement.findByPk(achievementId);
  }

  /**
   * Get achievement by key
   * @param {string} key - Achievement key
   * @returns {Object|null} Achievement definition
   */
  async findAchievementByKey(key) {
    return this.Achievement.findOne({ where: { key } });
  }

  /**
   * Get user's achievement progress
   * @param {number} userId - User ID
   * @param {number} achievementId - Achievement ID
   * @returns {Object|null} UserAchievement instance
   */
  async getUserAchievementProgress(userId, achievementId) {
    return this.UserAchievement.findOne({
      where: { user_id: userId, achievement_id: achievementId },
      include: [{ model: this.Achievement, as: 'achievement' }]
    });
  }

  /**
   * Get all user achievements
   * @param {number} userId - User ID
   * @param {Object} options - Optional filters
   * @returns {Array} UserAchievement instances
   */
  async getUserAchievements(userId, options = {}) {
    const where = { user_id: userId };

    const include = [{
      model: this.Achievement,
      as: 'achievement',
      where: { is_active: true }
    }];

    if (options.unlocked === true) {
      where.unlocked_at = { [Op.ne]: null };
    } else if (options.unlocked === false) {
      where.unlocked_at = null;
    }

    if (options.claimed === true) {
      where.claimed_at = { [Op.ne]: null };
    } else if (options.claimed === false) {
      where.claimed_at = null;
    }

    if (options.category) {
      include[0].where.category = options.category;
    }

    return this.UserAchievement.findAll({
      where,
      include,
      order: [[{ model: this.Achievement, as: 'achievement' }, 'tier', 'DESC']]
    });
  }

  /**
   * Create or update user achievement progress
   * @param {number} userId - User ID
   * @param {number} achievementId - Achievement ID
   * @param {number} progress - Progress value
   * @returns {Object} UserAchievement instance
   */
  async upsertUserAchievement(userId, achievementId, progress) {
    const [userAchievement, created] = await this.UserAchievement.findOrCreate({
      where: { user_id: userId, achievement_id: achievementId },
      defaults: { progress }
    });

    if (!created && progress !== undefined) {
      userAchievement.progress = progress;
      await userAchievement.save();
    }

    return userAchievement;
  }

  /**
   * Increment achievement progress
   * @param {number} userId - User ID
   * @param {number} achievementId - Achievement ID
   * @param {number} increment - Progress increment
   * @returns {Object} UserAchievement instance
   */
  async incrementProgress(userId, achievementId, increment) {
    const userAchievement = await this.upsertUserAchievement(userId, achievementId, 0);
    userAchievement.progress = (userAchievement.progress || 0) + increment;
    await userAchievement.save();
    return userAchievement;
  }

  /**
   * Mark achievement as unlocked
   * @param {number} userAchievementId - UserAchievement ID
   * @returns {Object} Updated UserAchievement
   */
  async markUnlocked(userAchievementId) {
    const userAchievement = await this.UserAchievement.findByPk(userAchievementId);
    if (!userAchievement) {
      throw new Error(`UserAchievement ${userAchievementId} not found`);
    }

    if (!userAchievement.unlocked_at) {
      userAchievement.unlocked_at = new Date();
      await userAchievement.save();
    }

    return userAchievement;
  }

  /**
   * Mark achievement rewards as claimed
   * @param {number} userAchievementId - UserAchievement ID
   * @returns {Object} Updated UserAchievement
   */
  async markClaimed(userAchievementId) {
    const userAchievement = await this.UserAchievement.findByPk(userAchievementId);
    if (!userAchievement) {
      throw new Error(`UserAchievement ${userAchievementId} not found`);
    }

    userAchievement.claimed_at = new Date();
    await userAchievement.save();

    return userAchievement;
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
   * Get achievement statistics for user
   * @param {number} userId - User ID
   * @returns {Object} Achievement statistics
   */
  async getUserAchievementStats(userId) {
    const achievements = await this.getUserAchievements(userId);
    
    const stats = {
      total: achievements.length,
      unlocked: 0,
      claimed: 0,
      locked: 0,
      totalPoints: 0,
      byTier: {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        diamond: 0
      }
    };

    achievements.forEach(ua => {
      if (ua.unlocked_at) {
        stats.unlocked++;
        stats.totalPoints += ua.achievement?.points || 0;
        
        if (ua.achievement?.tier) {
          stats.byTier[ua.achievement.tier]++;
        }
        
        if (ua.claimed_at) {
          stats.claimed++;
        }
      } else {
        stats.locked++;
      }
    });

    return stats;
  }

  /**
   * Get leaderboard (top users by achievement points)
   * @param {number} limit - Number of users to return
   * @returns {Array} Leaderboard data
   */
  async getLeaderboard(limit = 100) {
    const result = await this.UserAchievement.findAll({
      attributes: [
        'user_id',
        [this.sequelize.fn('COUNT', this.sequelize.col('UserAchievement.id')), 'unlocked_count'],
        [this.sequelize.fn('SUM', this.sequelize.col('achievement.points')), 'total_points']
      ],
      include: [
        {
          model: this.Achievement,
          as: 'achievement',
          attributes: []
        },
        {
          model: this.User,
          as: 'user',
          attributes: ['id', 'username', 'level']
        }
      ],
      where: {
        unlocked_at: { [Op.ne]: null }
      },
      group: ['user_id', 'user.id', 'user.username', 'user.level'],
      order: [[this.sequelize.literal('total_points'), 'DESC']],
      limit,
      raw: false,
      subQuery: false
    });

    return result;
  }
}

module.exports = SequelizeAchievementRepository;
