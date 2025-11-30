const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PortalMastery = sequelize.define(
    'PortalMastery',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tier: {
        type: DataTypes.ENUM('grey', 'green', 'blue', 'purple', 'red', 'golden'),
        allowNull: false,
      },
      clears: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      fastest_time: {
        type: DataTypes.INTEGER,
      },
      total_rewards: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      mastery_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 4,
        },
      },
      last_clear: {
        type: DataTypes.DATE,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'portal_mastery',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['tier', 'clears'] },
        { unique: true, fields: ['user_id', 'tier'] },
      ],
    }
  );

  PortalMastery.associate = (models) => {
    PortalMastery.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return PortalMastery;
};
