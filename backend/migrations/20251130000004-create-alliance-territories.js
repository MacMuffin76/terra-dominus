'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alliance_territories', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      territory_type: {
        type: Sequelize.ENUM('strategic_point', 'resource_node', 'defensive_outpost', 'trade_hub'),
        allowNull: false,
        defaultValue: 'strategic_point'
      },
      coord_x: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      coord_y: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      radius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Area of influence radius'
      },
      control_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Points needed to maintain control'
      },
      bonuses: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Resource production bonuses, defense bonuses, etc.'
      },
      captured_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_attack: {
        type: Sequelize.DATE,
        allowNull: true
      },
      defense_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Upgradeable defense level'
      },
      garrison_strength: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total military power defending the territory'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint: one territory per coordinates
    await queryInterface.addIndex('alliance_territories', ['coord_x', 'coord_y'], {
      unique: true,
      name: 'idx_territories_coords_unique'
    });

    // Index for alliance queries
    await queryInterface.addIndex('alliance_territories', ['alliance_id'], {
      name: 'idx_territories_alliance'
    });

    // Index for spatial queries (find territories near coordinates)
    await queryInterface.addIndex('alliance_territories', ['coord_x', 'coord_y'], {
      name: 'idx_territories_spatial'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alliance_territories');
  }
};
