const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AllianceInvitation = sequelize.define('AllianceInvitation', {
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
  inviterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'inviter_id'
  },
  inviteeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'invitee_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
    defaultValue: 'pending',
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'responded_at'
  }
}, {
  tableName: 'alliance_invitations',
  underscored: true,
  timestamps: true
});

// Associations
AllianceInvitation.associate = (models) => {
  AllianceInvitation.belongsTo(models.Alliance, { foreignKey: 'allianceId', as: 'alliance' });
  AllianceInvitation.belongsTo(models.User, { foreignKey: 'inviterId', as: 'inviter' });
  AllianceInvitation.belongsTo(models.User, { foreignKey: 'inviteeId', as: 'invitee' });
};

module.exports = AllianceInvitation;
