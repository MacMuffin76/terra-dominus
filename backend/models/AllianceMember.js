const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AllianceMember = sequelize.define('AllianceMember', {
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
  role: {
    type: DataTypes.ENUM('leader', 'officer', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  contribution: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  }
}, {
  tableName: 'alliance_members',
  underscored: true,
  timestamps: true
});

// Associations
AllianceMember.associate = (models) => {
  AllianceMember.belongsTo(models.Alliance, { foreignKey: 'allianceId', as: 'alliance' });
  AllianceMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = AllianceMember;
