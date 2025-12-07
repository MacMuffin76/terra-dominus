const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class ActionQueue extends Model {}

ActionQueue.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('research', 'training', 'defense'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('queued', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'queued',
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  finishTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  slot: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'ActionQueue',
  tableName: 'action_queues',
});

module.exports = ActionQueue;
