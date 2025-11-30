const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaderboardReward = sequelize.define('LeaderboardReward', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category: {
      type: DataTypes.ENUM(
        'total_power',
        'economy',
        'combat_victories',
        'buildings',
        'research',
        'resources',
        'portals',
        'achievements',
        'battle_pass'
      ),
      allowNull: false
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de la saison (null = permanent)'
    },
    rank_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    rank_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    reward_type: {
      type: DataTypes.ENUM(
        'premium_currency',
        'resources',
        'cosmetic',
        'title',
        'badge',
        'unit',
        'building_skin',
        'boost'
      ),
      allowNull: false
    },
    reward_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Données spécifiques à la récompense'
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    display_icon: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'leaderboard_rewards',
    underscored: true,
    indexes: [
      {
        fields: ['category', 'season_id']
      }
    ]
  });

  LeaderboardReward.associate = (models) => {
    LeaderboardReward.hasMany(models.UserLeaderboardReward, {
      foreignKey: 'reward_id',
      as: 'userClaims'
    });
  };

  return LeaderboardReward;
};
