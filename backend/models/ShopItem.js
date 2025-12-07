const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ShopItem = sequelize.define('ShopItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priceCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'price_cents'
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    allowNull: false,
    defaultValue: 'EUR'
  },
  inventory: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'shop_items',
  underscored: true
});

module.exports = ShopItem;