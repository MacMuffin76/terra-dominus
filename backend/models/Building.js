const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Building = sequelize.define('Building', {
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
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  production_horaire: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  capacite: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'buildings',
  timestamps: false,
});

module.exports = Building;
