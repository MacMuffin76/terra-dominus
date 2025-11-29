const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AllianceDiplomacy = sequelize.define('AllianceDiplomacy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  allianceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'alliance_id'
  },
  targetAllianceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'target_alliance_id'
  },
  relationType: {
    type: DataTypes.ENUM('neutral', 'ally', 'nap', 'war'),
    defaultValue: 'neutral',
    allowNull: false,
    field: 'relation_type'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  proposedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'proposed_by'
  },
  acceptedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'accepted_by'
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'starts_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  terms: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'alliance_diplomacy',
  underscored: true,
  timestamps: true
});

module.exports = AllianceDiplomacy;
