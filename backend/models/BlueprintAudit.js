const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const BlueprintAudit = sequelize.define('BlueprintAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  blueprint_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  before: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  after: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'blueprint_audits',
  timestamps: false,
  underscored: true,
});

module.exports = BlueprintAudit;