const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TutorialProgress = sequelize.define('TutorialProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  current_step: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  skipped: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  completed_steps: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tutorial_progress',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TutorialProgress;
