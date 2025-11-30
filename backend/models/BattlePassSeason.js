const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BattlePassSeason = sequelize.define('BattlePassSeason', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    season_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        min: 1
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStart(value) {
          if (value <= this.start_date) {
            throw new Error('end_date must be after start_date');
          }
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    max_tier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 200
      }
    },
    xp_per_tier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
      validate: {
        min: 100
      }
    },
    premium_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'battle_pass_seasons',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['season_number'], unique: true },
      { fields: ['start_date', 'end_date'] }
    ]
  });

  BattlePassSeason.associate = (models) => {
    // Season has many rewards
    BattlePassSeason.hasMany(models.BattlePassReward, {
      foreignKey: 'season_id',
      as: 'rewards'
    });

    // Season has many user progress records
    BattlePassSeason.hasMany(models.UserBattlePass, {
      foreignKey: 'season_id',
      as: 'userProgress'
    });
  };

  return BattlePassSeason;
};
