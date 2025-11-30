const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class UserQuest extends Model {}

UserQuest.init(
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
    quest_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quests',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('available', 'in_progress', 'completed', 'claimed'),
      allowNull: false,
      defaultValue: 'available',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UserQuest',
    tableName: 'user_quests',
    timestamps: true,
  }
);

module.exports = UserQuest;
