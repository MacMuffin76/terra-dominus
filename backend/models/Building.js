// backend/models/Building.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Building = sequelize.define('Building', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // on part de 0 maintenant
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.STRING(1500),
    allowNull: true,
  },
  build_start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  build_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  building_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'buildings',
  timestamps: false,
});

module.exports = Building;
