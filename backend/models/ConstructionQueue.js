const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ConstructionQueue = sequelize.define('ConstructionQueue', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'city_id',
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'entity_id',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('queued', 'in_progress', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'queued',
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'start_time',
  },
  finishTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'finish_time',
  },
  slot: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'construction_queue',
  timestamps: false,
});

module.exports = ConstructionQueue;