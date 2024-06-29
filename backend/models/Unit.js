const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Unit = sequelize.define('Unit', {
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  force: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  capacite_speciale: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'units',
  timestamps: false,
});

module.exports = Unit;
