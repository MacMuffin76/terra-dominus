const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PortalAttempt = sequelize.define(
    'PortalAttempt',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      portal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      units_sent: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      result: {
        type: DataTypes.ENUM('victory', 'defeat', 'retreat'),
        allowNull: false,
      },
      units_lost: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      units_survived: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      rewards: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      battle_duration: {
        type: DataTypes.INTEGER,
      },
      tactic_used: {
        type: DataTypes.STRING(50),
        defaultValue: 'balanced',
      },
      attempt_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'portal_attempts',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['portal_id'] },
        { fields: ['result'] },
        { fields: ['attempt_time'] },
      ],
    }
  );

  PortalAttempt.associate = (models) => {
    PortalAttempt.belongsTo(models.Portal, {
      foreignKey: 'portal_id',
      as: 'portal',
    });
    PortalAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return PortalAttempt;
};
