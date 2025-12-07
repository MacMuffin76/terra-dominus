const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const UserTransaction = sequelize.define('UserTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  paymentIntentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'payment_intent_id'
  },
  shopItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'shop_item_id'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  amountCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'amount_cents'
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'failure_reason'
  }
}, {
  tableName: 'user_transactions',
  underscored: true
});

module.exports = UserTransaction;