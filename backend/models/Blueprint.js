const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Blueprint = sequelize.define('Blueprint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  max_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  base_duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  costs: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
}, {
  tableName: 'blueprints',
  underscored: true,
  timestamps: true,
});

module.exports = Blueprint;