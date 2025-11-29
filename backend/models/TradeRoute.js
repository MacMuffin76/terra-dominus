const { Model, DataTypes } = require('sequelize');

class TradeRoute extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      owner_user_id: {
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
      route_type: {
        type: DataTypes.ENUM('internal', 'external'),
        allowNull: false,
        defaultValue: 'internal'
      },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'broken'),
        allowNull: false,
        defaultValue: 'active'
      },
      distance: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      auto_transfer_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      auto_transfer_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      auto_transfer_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      transfer_frequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3600
      },
      trade_offer_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_offer_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_offer_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_request_gold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_request_metal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_request_fuel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_convoys: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_gold_traded: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_metal_traded: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_fuel_traded: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      last_convoy_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      established_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'TradeRoute',
      tableName: 'trade_routes',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['owner_user_id', 'status'] },
        { fields: ['origin_city_id'] },
        { fields: ['destination_city_id'] },
        { fields: ['status'] },
        { fields: ['route_type'] }
      ]
    });

    return TradeRoute;
  }

  static associate(models) {
    TradeRoute.belongsTo(models.User, {
      foreignKey: 'owner_user_id',
      as: 'owner'
    });
    TradeRoute.belongsTo(models.City, {
      foreignKey: 'origin_city_id',
      as: 'originCity'
    });
    TradeRoute.belongsTo(models.City, {
      foreignKey: 'destination_city_id',
      as: 'destinationCity'
    });
    TradeRoute.hasMany(models.TradeConvoy, {
      foreignKey: 'trade_route_id',
      as: 'convoys'
    });
  }
}

module.exports = TradeRoute;
