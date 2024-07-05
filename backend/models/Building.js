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
    validate: {
      len: [1, 255]
    }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.STRING(1500),
    allowNull: true, // Allow null if description is not mandatory
  },
}, {
  tableName: 'buildings',
  timestamps: false,
});

module.exports = Building;
