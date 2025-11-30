const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserLeaderboardReward = sequelize.define('UserLeaderboardReward', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leaderboard_rewards',
        key: 'id'
      }
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rank_achieved: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Rang atteint pour obtenir cette récompense',
      validate: {
        min: 1
      }
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_leaderboard_rewards',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'reward_id', 'season_id']
      }
    ]
  });

  UserLeaderboardReward.associate = (models) => {
    UserLeaderboardReward.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    UserLeaderboardReward.belongsTo(models.LeaderboardReward, {
      foreignKey: 'reward_id',
      as: 'reward'
    });
  };

  return UserLeaderboardReward;
};
