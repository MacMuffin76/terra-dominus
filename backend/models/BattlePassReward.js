const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BattlePassReward = sequelize.define('BattlePassReward', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    track: {
      type: DataTypes.ENUM('free', 'premium'),
      allowNull: false
    },
    reward_type: {
      type: DataTypes.ENUM(
        'resources',
        'units',
        'buildings',
        'boost',
        'cosmetic',
        'blueprint',
        'item',
        'xp',
        'gems'
      ),
      allowNull: false
    },
    reward_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    display_icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_highlight: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'battle_pass_rewards',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['season_id'] },
      { fields: ['tier'] },
      { fields: ['track'] },
      { fields: ['season_id', 'tier', 'track'] }
    ]
  });

  BattlePassReward.associate = (models) => {
    // Reward belongs to a season
    BattlePassReward.belongsTo(models.BattlePassSeason, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // Reward can be claimed by many users
    BattlePassReward.hasMany(models.UserBattlePassReward, {
      foreignKey: 'reward_id',
      as: 'userClaims'
    });
  };

  return BattlePassReward;
};
