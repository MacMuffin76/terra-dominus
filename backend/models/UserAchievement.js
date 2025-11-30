// UserAchievement.js - Sequelize model for user achievement progress
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class UserAchievement extends Model {}

UserAchievement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    achievement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id',
      },
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unlocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UserAchievement',
    tableName: 'user_achievements',
    timestamps: true,
    underscored: true,
  }
);

module.exports = UserAchievement;
