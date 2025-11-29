'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table des ordres de marché
    await queryInterface.createTable('market_orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      order_type: {
        type: Sequelize.ENUM('buy', 'sell'),
        allowNull: false,
        comment: 'Type of order: buy or sell'
      },
      resource_type: {
        type: Sequelize.ENUM('gold', 'metal', 'fuel', 'food'),
        allowNull: false,
        comment: 'Resource being traded'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Total quantity in the order'
      },
      remaining_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Quantity still available'
      },
      price_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per unit in gold'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled', 'expired'),
        allowNull: false,
        defaultValue: 'active'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Optional expiration date'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Table des transactions de marché
    await queryInterface.createTable('market_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'market_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      buyer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      buyer_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        }
      },
      seller_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        }
      },
      resource_type: {
        type: Sequelize.ENUM('gold', 'metal', 'fuel', 'food'),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Transaction tax (e.g., 5%)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indices pour performances
    await queryInterface.addIndex('market_orders', ['user_id'], {
      name: 'idx_market_orders_user'
    });

    await queryInterface.addIndex('market_orders', ['resource_type', 'order_type', 'status'], {
      name: 'idx_market_orders_active'
    });

    await queryInterface.addIndex('market_orders', ['status', 'created_at'], {
      name: 'idx_market_orders_status_date'
    });

    await queryInterface.addIndex('market_transactions', ['buyer_id'], {
      name: 'idx_market_transactions_buyer'
    });

    await queryInterface.addIndex('market_transactions', ['seller_id'], {
      name: 'idx_market_transactions_seller'
    });

    await queryInterface.addIndex('market_transactions', ['created_at'], {
      name: 'idx_market_transactions_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les indices
    await queryInterface.removeIndex('market_transactions', 'idx_market_transactions_date');
    await queryInterface.removeIndex('market_transactions', 'idx_market_transactions_seller');
    await queryInterface.removeIndex('market_transactions', 'idx_market_transactions_buyer');
    await queryInterface.removeIndex('market_orders', 'idx_market_orders_status_date');
    await queryInterface.removeIndex('market_orders', 'idx_market_orders_active');
    await queryInterface.removeIndex('market_orders', 'idx_market_orders_user');

    // Supprimer les tables
    await queryInterface.dropTable('market_transactions');
    await queryInterface.dropTable('market_orders');

    // Supprimer les ENUM types (PostgreSQL)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_market_orders_order_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_market_orders_resource_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_market_orders_status";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_market_transactions_resource_type";'
    );
  }
};
