const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ResearchQueue = sequelize.define('ResearchQueue', {
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
  researchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'research_id',
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
  tableName: 'research_queue',
  timestamps: false,
});

module.exports = ResearchQueue;