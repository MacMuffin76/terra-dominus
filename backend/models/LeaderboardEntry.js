const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
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
      allowNull: false,
      validate: {
        isIn: [[
          'total_power',
          'economy',
          'combat_victories',
          'buildings',
          'research',
          'resources',
          'portals',
          'achievements',
          'battle_pass'
        ]]
      }
    },
    score: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    previous_rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'leaderboard_entries',
    underscored: true,
    indexes: [
      {
        fields: ['category', 'score']
      },
      {
        unique: true,
        fields: ['user_id', 'category']
      },
      {
        fields: ['category', 'rank']
      }
    ]
  });

  LeaderboardEntry.associate = (models) => {
    LeaderboardEntry.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return LeaderboardEntry;
};
