const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBattlePass = sequelize.define('UserBattlePass', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    current_tier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    current_xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total_xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    has_premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    premium_purchased_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_battle_pass',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['season_id'] },
      { fields: ['user_id', 'season_id'], unique: true }
    ]
  });

  UserBattlePass.associate = (models) => {
    // User battle pass belongs to a user
    UserBattlePass.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // User battle pass belongs to a season
    UserBattlePass.belongsTo(models.BattlePassSeason, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // User battle pass has many claimed rewards
    UserBattlePass.hasMany(models.UserBattlePassReward, {
      foreignKey: 'user_id',
      as: 'claimedRewards'
    });
  };

  return UserBattlePass;
};
