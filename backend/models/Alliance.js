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
};

module.exports = Alliance;
