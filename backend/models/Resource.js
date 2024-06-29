const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('or', 'bois', 'nourriture', 'pierre', 'metal', 'energie'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'resources',
  timestamps: false,
});

module.exports = Resource;
