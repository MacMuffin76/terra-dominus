const { Model, DataTypes } = require('sequelize');

class Attack extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      attacker_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      attacker_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      defender_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      defender_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      attack_type: {
        type: DataTypes.ENUM('raid', 'conquest', 'siege'),
        allowNull: false,
        defaultValue: 'raid'
      },
      status: {
        type: DataTypes.ENUM('traveling', 'arrived', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      arrival_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      distance: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      outcome: {
        type: DataTypes.ENUM('attacker_victory', 'defender_victory', 'draw'),
        allowNull: true
      },
      loot_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      loot_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      loot_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      attacker_losses: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      defender_losses: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'Attack',
      tableName: 'attacks',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['attacker_user_id', 'status'] },
        { fields: ['defender_user_id', 'status'] },
        { fields: ['arrival_time'] },
        { fields: ['status'] }
      ]
    });

    return Attack;
  }

  static associate(models) {
    Attack.belongsTo(models.User, {
      foreignKey: 'attacker_user_id',
      as: 'attacker'
    });
    Attack.belongsTo(models.User, {
      foreignKey: 'defender_user_id',
      as: 'defender'
    });
    Attack.belongsTo(models.City, {
      foreignKey: 'attacker_city_id',
      as: 'attackerCity'
    });
    Attack.belongsTo(models.City, {
      foreignKey: 'defender_city_id',
      as: 'defenderCity'
    });
    Attack.hasMany(models.AttackWave, {
      foreignKey: 'attack_id',
      as: 'waves'
    });
    Attack.hasOne(models.DefenseReport, {
      foreignKey: 'attack_id',
      as: 'report'
    });
  }
}

module.exports = Attack;
