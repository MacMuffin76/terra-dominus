const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AllianceJoinRequest = sequelize.define('AllianceJoinRequest', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reviewed_by'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at'
  }
}, {
  tableName: 'alliance_join_requests',
  underscored: true,
  timestamps: true
});

// Associations
AllianceJoinRequest.associate = (models) => {
  AllianceJoinRequest.belongsTo(models.Alliance, { foreignKey: 'allianceId', as: 'alliance' });
  AllianceJoinRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  AllianceJoinRequest.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
};

module.exports = AllianceJoinRequest;
