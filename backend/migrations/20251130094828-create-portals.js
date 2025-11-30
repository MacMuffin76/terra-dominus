'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table portals
    await queryInterface.createTable('portals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tier: {
        type: Sequelize.ENUM('GREY', 'GREEN', 'BLUE', 'PURPLE', 'RED', 'GOLD'),
        allowNull: false,
      },
      coord_x: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      coord_y: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      power: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      enemies: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      loot_table: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cleared'),
        allowNull: false,
        defaultValue: 'active',
      },
      spawned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      times_challenged: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      times_cleared: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Indexes pour portals
    await queryInterface.addIndex('portals', ['status'], {
      name: 'idx_portals_status'
    });
    await queryInterface.addIndex('portals', ['coord_x', 'coord_y'], {
      name: 'idx_portals_coords'
    });
    await queryInterface.addIndex('portals', ['expires_at'], {
      name: 'idx_portals_expires_at'
    });
    await queryInterface.addIndex('portals', ['tier'], {
      name: 'idx_portals_tier'
    });

    // Table portal_expeditions
    await queryInterface.createTable('portal_expeditions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      portal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      units: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('traveling', 'victory', 'defeat'),
        allowNull: false,
        defaultValue: 'traveling',
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      arrival_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      distance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      loot_gained: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      survivors: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Indexes pour portal_expeditions
    await queryInterface.addIndex('portal_expeditions', ['user_id'], {
      name: 'idx_portal_expeditions_user'
    });
    await queryInterface.addIndex('portal_expeditions', ['portal_id'], {
      name: 'idx_portal_expeditions_portal'
    });
    await queryInterface.addIndex('portal_expeditions', ['status'], {
      name: 'idx_portal_expeditions_status'
    });
    await queryInterface.addIndex('portal_expeditions', ['arrival_time'], {
      name: 'idx_portal_expeditions_arrival'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('portal_expeditions');
    await queryInterface.dropTable('portals');
  }
};
