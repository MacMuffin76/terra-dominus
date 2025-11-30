/**
 * DailyQuestRotation Model
 * Manages daily quest rotation (3 quests per day, midnight UTC reset)
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const DailyQuestRotation = sequelize.define(
    'DailyQuestRotation',
    {
      rotation_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
        comment: 'Date for this rotation (YYYY-MM-DD)',
      },
      
      quest_ids: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
        comment: 'Array of 3 quest IDs for this day',
        validate: {
          isValidLength(value) {
            if (!Array.isArray(value) || value.length !== 3) {
              throw new Error('quest_ids must contain exactly 3 quest IDs');
            }
          },
        },
      },
      
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'daily_quest_rotation',
      timestamps: false,
      indexes: [
        { fields: ['date'], unique: true },
      ],
    }
  );

  // Instance methods
  DailyQuestRotation.prototype.isToday = function () {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  };

  DailyQuestRotation.prototype.isExpired = function () {
    const today = new Date().toISOString().split('T')[0];
    return this.date < today;
  };

  DailyQuestRotation.prototype.getQuestIds = function () {
    return this.quest_ids || [];
  };

  DailyQuestRotation.prototype.hasQuestId = function (questId) {
    return (this.quest_ids || []).includes(questId);
  };

  DailyQuestRotation.prototype.getSummary = function () {
    return {
      rotation_id: this.rotation_id,
      date: this.date,
      quest_ids: this.quest_ids,
      quest_count: this.quest_ids?.length || 0,
      is_today: this.isToday(),
      is_expired: this.isExpired(),
      created_at: this.created_at,
    };
  };

  // Class methods
  DailyQuestRotation.getTodayDate = function () {
    return new Date().toISOString().split('T')[0];
  };

  DailyQuestRotation.getYesterdayDate = function () {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  return DailyQuestRotation;
};
