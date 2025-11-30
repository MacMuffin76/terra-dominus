/**
 * QuestStreak Model
 * Tracks daily quest completion streaks with bonus rewards
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const QuestStreak = sequelize.define(
    'QuestStreak',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      
      current_streak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      
      longest_streak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      
      last_completed_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Date of last daily quest completion (YYYY-MM-DD)',
      },
    },
    {
      tableName: 'quest_streaks',
      timestamps: true,
      underscored: true,
    }
  );

  // Instance methods
  QuestStreak.prototype.getStreakBonus = function () {
    // +10% bonus per day, max 50% (5 days)
    const bonusPercent = Math.min(this.current_streak * 10, 50);
    return bonusPercent / 100;
  };

  QuestStreak.prototype.getStreakBonusPercent = function () {
    return Math.min(this.current_streak * 10, 50);
  };

  QuestStreak.prototype.incrementStreak = function () {
    this.current_streak += 1;
    this.last_completed_date = new Date().toISOString().split('T')[0];
    
    if (this.current_streak > this.longest_streak) {
      this.longest_streak = this.current_streak;
    }
  };

  QuestStreak.prototype.resetStreak = function () {
    this.current_streak = 0;
    this.last_completed_date = null;
  };

  QuestStreak.prototype.shouldResetStreak = function () {
    if (!this.last_completed_date) return false;

    const today = new Date();
    const lastCompleted = new Date(this.last_completed_date);
    
    // Calculate days difference
    const diffTime = today - lastCompleted;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Reset if more than 1 day has passed (missed a day)
    return diffDays > 1;
  };

  QuestStreak.prototype.canIncrementToday = function () {
    const today = new Date().toISOString().split('T')[0];
    
    // Can increment if:
    // 1. No last completion (first time)
    // 2. Last completion was yesterday (continuing streak)
    if (!this.last_completed_date) return true;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return this.last_completed_date === yesterdayStr;
  };

  QuestStreak.prototype.hasCompletedToday = function () {
    if (!this.last_completed_date) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return this.last_completed_date === today;
  };

  QuestStreak.prototype.getSummary = function () {
    return {
      user_id: this.user_id,
      current_streak: this.current_streak,
      longest_streak: this.longest_streak,
      last_completed_date: this.last_completed_date,
      streak_bonus_percent: this.getStreakBonusPercent(),
      streak_bonus_multiplier: 1 + this.getStreakBonus(),
      can_increment_today: this.canIncrementToday(),
      completed_today: this.hasCompletedToday(),
      should_reset: this.shouldResetStreak(),
    };
  };

  // Associations
  QuestStreak.associate = (models) => {
    QuestStreak.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return QuestStreak;
};
