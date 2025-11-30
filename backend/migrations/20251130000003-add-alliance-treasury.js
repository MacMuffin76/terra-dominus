'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add treasury columns to alliances table
    await queryInterface.addColumn('alliances', 'treasury_gold', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('alliances', 'treasury_metal', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('alliances', 'treasury_fuel', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('alliances', 'treasury_energy', {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0
    });

    // Add war statistics
    await queryInterface.addColumn('alliances', 'wars_won', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('alliances', 'wars_lost', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('alliances', 'territories_controlled', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Create alliance_treasury_logs table for transaction history
    await queryInterface.createTable('alliance_treasury_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      transaction_type: {
        type: Sequelize.ENUM('deposit', 'withdraw', 'tax', 'war_loot', 'territory_income', 'upgrade_cost'),
        allowNull: false
      },
      resource_type: {
        type: Sequelize.ENUM('gold', 'metal', 'fuel', 'energy'),
        allowNull: false
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      balance_before: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      balance_after: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index for efficient queries
    await queryInterface.addIndex('alliance_treasury_logs', ['alliance_id', 'created_at'], {
      name: 'idx_treasury_logs_alliance_date'
    });

    await queryInterface.addIndex('alliance_treasury_logs', ['user_id'], {
      name: 'idx_treasury_logs_user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alliance_treasury_logs');
    
    await queryInterface.removeColumn('alliances', 'treasury_gold');
    await queryInterface.removeColumn('alliances', 'treasury_metal');
    await queryInterface.removeColumn('alliances', 'treasury_fuel');
    await queryInterface.removeColumn('alliances', 'treasury_energy');
    await queryInterface.removeColumn('alliances', 'wars_won');
    await queryInterface.removeColumn('alliances', 'wars_lost');
    await queryInterface.removeColumn('alliances', 'territories_controlled');
  }
};
