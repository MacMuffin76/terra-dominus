const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Alliance = sequelize.define('Alliance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  tag: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  leaderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'leader_id'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRecruiting: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_recruiting'
  },
  minLevelRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'min_level_required'
  },
  memberCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'member_count'
  },
  totalPower: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'total_power'
  },
  treasuryGold: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'treasury_gold'
  },
  treasuryMetal: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'treasury_metal'
  },
  treasuryFuel: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'treasury_fuel'
  },
  treasuryEnergy: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'treasury_energy'
  },
  warsWon: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'wars_won'
  },
  warsLost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'wars_lost'
  },
  territoriesControlled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'territories_controlled'
  }
}, {
  tableName: 'alliances',
  underscored: true,
  timestamps: true
});

// Associations
Alliance.associate = (models) => {
  Alliance.belongsTo(models.User, { foreignKey: 'leaderId', as: 'leader' });
  Alliance.hasMany(models.AllianceMember, { foreignKey: 'allianceId', as: 'members' });
  Alliance.hasMany(models.AllianceInvitation, { foreignKey: 'allianceId', as: 'invitations' });
  Alliance.hasMany(models.AllianceJoinRequest, { foreignKey: 'allianceId', as: 'joinRequests' });
  Alliance.hasMany(models.AllianceTreasuryLog, { foreignKey: 'allianceId', as: 'treasuryLogs' });
  Alliance.hasMany(models.AllianceTerritory, { foreignKey: 'allianceId', as: 'territories' });
  Alliance.hasMany(models.AllianceWar, { foreignKey: 'attackerAllianceId', as: 'warsAsAttacker' });
  Alliance.hasMany(models.AllianceWar, { foreignKey: 'defenderAllianceId', as: 'warsAsDefender' });
};

module.exports = Alliance;
