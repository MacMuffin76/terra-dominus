// backend/models/City.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const City = sequelize.define('City', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  is_capital: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  coord_x: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  coord_y: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vision_range: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  founded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'cities',
  timestamps: false,
});

module.exports = City;
