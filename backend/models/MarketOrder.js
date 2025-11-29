const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MarketOrder = sequelize.define('MarketOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  cityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'city_id',
  },
  orderType: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
    field: 'order_type',
  },
  resourceType: {
    type: DataTypes.ENUM('gold', 'metal', 'fuel', 'food'),
    allowNull: false,
    field: 'resource_type',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  remainingQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'remaining_quantity',
  },
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_unit',
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  },
}, {
  tableName: 'market_orders',
  timestamps: true,
  underscored: true,
});

MarketOrder.associate = (models) => {
  MarketOrder.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  MarketOrder.belongsTo(models.City, {
    foreignKey: 'cityId',
    as: 'city',
  });
  MarketOrder.hasMany(models.MarketTransaction, {
    foreignKey: 'orderId',
    as: 'transactions',
  });
};

module.exports = MarketOrder;
