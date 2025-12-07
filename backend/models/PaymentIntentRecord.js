const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PaymentIntentRecord = sequelize.define('PaymentIntent', {
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
  shopItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'shop_item_id'
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
    type: DataTypes.ENUM('requires_payment_method', 'processing', 'succeeded', 'failed', 'canceled'),
    allowNull: false,
    defaultValue: 'requires_payment_method'
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'failure_reason'
  },
  stripeIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'stripe_intent_id'
  },
  checkoutSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'checkout_session_id'
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'idempotency_key'
  },
  requesterIp: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'requester_ip'
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'user_agent'
  },
  consentVersion: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'consent_version'
  },
  legalDocuments: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'legal_documents'
  }
}, {
  tableName: 'payment_intents',
  underscored: true
});

module.exports = PaymentIntentRecord;