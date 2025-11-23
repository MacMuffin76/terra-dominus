// backend/models/Resource.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class Resource extends Model {}

Resource.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  last_update: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'Resource',
  tableName: 'resources',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['city_id', 'type'],
    },
  ],
});

module.exports = Resource;
