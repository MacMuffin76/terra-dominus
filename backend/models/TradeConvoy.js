const { Model, DataTypes } = require('sequelize');

class TradeConvoy extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      trade_route_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      origin_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      destination_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('traveling', 'arrived', 'intercepted', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      cargo_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      escort_units: {
        type: DataTypes.JSONB,
        allowNull: true
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
      intercepted_by_attack_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cargo_lost_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_lost_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_lost_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      sequelize,
      modelName: 'TradeConvoy',
      tableName: 'trade_convoys',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['trade_route_id'] },
        { fields: ['status'] },
        { fields: ['arrival_time'] },
        { fields: ['origin_city_id'] },
        { fields: ['destination_city_id'] }
      ]
    });

    return TradeConvoy;
  }

  static associate(models) {
    TradeConvoy.belongsTo(models.TradeRoute, {
      foreignKey: 'trade_route_id',
      as: 'route'
    });
    TradeConvoy.belongsTo(models.City, {
      foreignKey: 'origin_city_id',
      as: 'originCity'
    });
    TradeConvoy.belongsTo(models.City, {
      foreignKey: 'destination_city_id',
      as: 'destinationCity'
    });
    TradeConvoy.belongsTo(models.Attack, {
      foreignKey: 'intercepted_by_attack_id',
      as: 'interceptingAttack'
    });
  }
}

module.exports = TradeConvoy;
