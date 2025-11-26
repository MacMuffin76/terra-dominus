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
  build_status: {
    type: DataTypes.VIRTUAL,
    get() {
      const start = this.getDataValue('build_start');
      const duration = Number(this.getDataValue('build_duration')) || 0;

      if (!start || !duration) return 'idle';

      const end = new Date(start.getTime() + duration * 1000);
      return end > new Date() ? 'in_progress' : 'ready';
    },
  },
  constructionEndsAt: {
    type: DataTypes.VIRTUAL,
    get() {
      const start = this.getDataValue('build_start');
      const duration = Number(this.getDataValue('build_duration')) || 0;

      if (!start || !duration) return null;

      return new Date(start.getTime() + duration * 1000);
    },
  },
  building_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'buildings',
  timestamps: false,
});

module.exports = Building;
