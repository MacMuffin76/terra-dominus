'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alliance_wars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attacker_alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      defender_alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      declared_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('active', 'ceasefire', 'ended'),
        allowNull: false,
        defaultValue: 'active'
      },
      war_goal: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Territory conquest, revenge, resources, etc.'
      },
      attacker_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'War points scored by attacker'
      },
      defender_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'War points scored by defender'
      },
      attacker_casualties: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Units lost by attacker'
      },
      defender_casualties: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Units lost by defender'
      },
      territories_contested: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'List of territory IDs under contention'
      },
      war_terms: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Peace treaty terms, reparations, etc.'
      },
      started_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      winner_alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Null if ongoing or draw'
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

    // Index for finding active wars involving an alliance
    await queryInterface.addIndex('alliance_wars', ['attacker_alliance_id', 'status'], {
      name: 'idx_wars_attacker_status'
    });

    await queryInterface.addIndex('alliance_wars', ['defender_alliance_id', 'status'], {
      name: 'idx_wars_defender_status'
    });

    // Index for ended wars (history)
    await queryInterface.addIndex('alliance_wars', ['status', 'ended_at'], {
      name: 'idx_wars_ended'
    });

    // Create war_battle_logs table for tracking individual battles
    await queryInterface.createTable('alliance_war_battles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      war_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliance_wars',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      battle_report_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Link to individual combat battle report (if exists)'
      },
      attacker_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      defender_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      outcome: {
        type: Sequelize.ENUM('attacker_victory', 'defender_victory', 'draw'),
        allowNull: false
      },
      points_awarded: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'War points awarded to winner'
      },
      resources_pillaged: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      territory_captured: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Territory ID if territory changed hands'
      },
      occurred_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index for war battles
    await queryInterface.addIndex('alliance_war_battles', ['war_id', 'occurred_at'], {
      name: 'idx_war_battles_war_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alliance_war_battles');
    await queryInterface.dropTable('alliance_wars');
  }
};
