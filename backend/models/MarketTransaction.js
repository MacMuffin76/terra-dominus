const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MarketTransaction = sequelize.define('MarketTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id',
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'buyer_id',
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seller_id',
  },
  buyerCityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'buyer_city_id',
  },
  sellerCityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seller_city_id',
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
  pricePerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'price_per_unit',
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_price',
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_amount',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  },
}, {
  tableName: 'market_transactions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  underscored: true,
});

MarketTransaction.associate = (models) => {
  MarketTransaction.belongsTo(models.MarketOrder, {
    foreignKey: 'orderId',
    as: 'order',
  });
  MarketTransaction.belongsTo(models.User, {
    foreignKey: 'buyerId',
    as: 'buyer',
  });
  MarketTransaction.belongsTo(models.User, {
    foreignKey: 'sellerId',
    as: 'seller',
  });
  MarketTransaction.belongsTo(models.City, {
    foreignKey: 'buyerCityId',
    as: 'buyerCity',
  });
  MarketTransaction.belongsTo(models.City, {
    foreignKey: 'sellerCityId',
    as: 'sellerCity',
  });
};

module.exports = MarketTransaction;
