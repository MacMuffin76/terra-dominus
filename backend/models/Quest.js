const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Quest extends Model {}

Quest.init(
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
      comment: 'Identifiant unique de la quête',
    },
    type: {
      type: DataTypes.ENUM('daily', 'weekly', 'achievement'),
      allowNull: false,
      defaultValue: 'daily',
    },
    category: {
      type: DataTypes.ENUM('combat', 'economy', 'buildings', 'research', 'social'),
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
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'epic'),
      allowNull: false,
      defaultValue: 'easy',
    },
    min_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    modelName: 'Quest',
    tableName: 'quests',
    timestamps: true,
  }
);

module.exports = Quest;
