'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shop_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price_cents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      currency: {
        type: Sequelize.ENUM('EUR', 'USD', 'GBP'),
        allowNull: false,
        defaultValue: 'EUR'
      },
      inventory: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });

    await queryInterface.createTable('payment_intents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      shop_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'shop_items', key: 'id' },
        onDelete: 'SET NULL'
      },
      amount_cents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      currency: {
        type: Sequelize.ENUM('EUR', 'USD', 'GBP'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('requires_payment_method', 'processing', 'succeeded', 'failed', 'canceled'),
        allowNull: false,
        defaultValue: 'requires_payment_method'
      },
      failure_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_intent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      checkout_session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      idempotency_key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      requester_ip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      consent_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      legal_documents: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
    await queryInterface.addConstraint('payment_intents', {
      fields: ['idempotency_key'],
      type: 'unique',
      name: 'uniq_payment_intents_idempotency'
    });

    await queryInterface.createTable('user_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      payment_intent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'payment_intents', key: 'id' },
        onDelete: 'SET NULL'
      },
      shop_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'shop_items', key: 'id' },
        onDelete: 'SET NULL'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      amount_cents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      currency: {
        type: Sequelize.ENUM('EUR', 'USD', 'GBP'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'succeeded', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      failure_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_transactions');
    await queryInterface.removeConstraint('payment_intents', 'uniq_payment_intents_idempotency');
    await queryInterface.dropTable('payment_intents');
    await queryInterface.dropTable('shop_items');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_payment_intents_currency\";DROP TYPE IF EXISTS \"enum_payment_intents_status\";DROP TYPE IF EXISTS \"enum_user_transactions_currency\";DROP TYPE IF EXISTS \"enum_user_transactions_status\";DROP TYPE IF EXISTS \"enum_shop_items_currency\";");
  }
};