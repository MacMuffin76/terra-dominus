const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBattlePassReward = sequelize.define('UserBattlePassReward', {
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
    reward_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_battle_pass_rewards',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['season_id'] },
      { fields: ['reward_id'] },
      { fields: ['user_id', 'reward_id'], unique: true }
    ]
  });

  UserBattlePassReward.associate = (models) => {
    // Claimed reward belongs to a user
    UserBattlePassReward.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Claimed reward belongs to a season
    UserBattlePassReward.belongsTo(models.BattlePassSeason, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // Claimed reward belongs to a reward definition
    UserBattlePassReward.belongsTo(models.BattlePassReward, {
      foreignKey: 'reward_id',
      as: 'reward'
    });
  };

  return UserBattlePassReward;
};
