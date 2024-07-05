const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Entity = sequelize.define('Entity', {
  entity_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  entity_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'entities',
  timestamps: false,
});

module.exports = Entity;
