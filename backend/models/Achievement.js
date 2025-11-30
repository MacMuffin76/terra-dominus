// Achievement.js - Sequelize model for achievement definitions
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Achievement extends Model {}

Achievement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for the achievement',
    },
    category: {
      type: DataTypes.ENUM('combat', 'economy', 'buildings', 'research', 'social', 'exploration', 'general'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
      allowNull: false,
      defaultValue: 'bronze',
    },
    objective_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    objective_target: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    objective_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    reward_or: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reward_metal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reward_carburant: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reward_xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reward_items: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    reward_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    is_secret: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Achievement',
    tableName: 'achievements',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Achievement;
