'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create portal_bosses table
    await queryInterface.createTable('portal_bosses', {
      boss_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      portal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portals',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      boss_type: {
        type: Sequelize.ENUM('elite_guardian', 'ancient_titan', 'void_reaver', 'cosmic_emperor'),
        allowNull: false,
        comment: 'Type of boss with unique mechanics',
      },
      base_hp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Maximum HP of the boss',
      },
      current_hp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Current HP (for persistent boss battles)',
      },
      current_phase: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Current phase 1-4 based on HP thresholds',
      },
      defense: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        comment: 'Boss defense rating',
      },
      abilities: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Array of boss abilities: shield_regen, aoe_blast, unit_disable',
      },
      abilities_used: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Log of abilities triggered with timestamps',
      },
      rewards: {
        type: Sequelize.JSONB,
        comment: 'Special boss rewards on defeat',
      },
      defeated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      defeated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who landed killing blow',
      },
      defeated_at: {
        type: Sequelize.DATE,
        comment: 'Timestamp when boss was defeated',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create portal_boss_attempts table
    await queryInterface.createTable('portal_boss_attempts', {
      attempt_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      boss_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portal_bosses',
          key: 'boss_id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      units_sent: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Unit composition sent to battle',
      },
      damage_dealt: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total damage dealt to boss',
      },
      phases_reached: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Highest phase reached in this attempt',
      },
      abilities_triggered: {
        type: Sequelize.JSONB,
        defaultValue: [],
        comment: 'Boss abilities that triggered during battle',
      },
      result: {
        type: Sequelize.ENUM('victory', 'defeat', 'phase_cleared'),
        allowNull: false,
      },
      units_lost: {
        type: Sequelize.JSONB,
        comment: 'Units lost in battle',
      },
      units_survived: {
        type: Sequelize.JSONB,
        comment: 'Units that survived',
      },
      rewards: {
        type: Sequelize.JSONB,
        comment: 'Rewards earned (if victory)',
      },
      battle_log: {
        type: Sequelize.JSONB,
        comment: 'Detailed battle log with rounds and events',
      },
      tactic_used: {
        type: Sequelize.ENUM('balanced', 'aggressive', 'defensive'),
        defaultValue: 'balanced',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create portal_alliance_raids table (for co-op raids)
    await queryInterface.createTable('portal_alliance_raids', {
      raid_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      boss_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portal_bosses',
          key: 'boss_id',
        },
        onDelete: 'CASCADE',
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      min_participants: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        comment: 'Minimum members required to start raid',
      },
      max_participants: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        comment: 'Maximum members allowed in raid',
      },
      status: {
        type: Sequelize.ENUM('forming', 'in_progress', 'victory', 'defeat'),
        defaultValue: 'forming',
      },
      total_damage: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total damage dealt by all participants',
      },
      rewards_pool: {
        type: Sequelize.JSONB,
        comment: 'Rewards to distribute based on contribution',
      },
      started_at: {
        type: Sequelize.DATE,
        comment: 'When raid began',
      },
      completed_at: {
        type: Sequelize.DATE,
        comment: 'When raid finished',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create portal_raid_participants table
    await queryInterface.createTable('portal_raid_participants', {
      participant_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      raid_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portal_alliance_raids',
          key: 'raid_id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      damage_contributed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      contribution_percent: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        comment: 'Percentage of total raid damage',
      },
      units_sent: {
        type: Sequelize.JSONB,
        comment: 'Units contributed to raid',
      },
      units_lost: {
        type: Sequelize.JSONB,
        comment: 'Units lost during raid',
      },
      rewards_earned: {
        type: Sequelize.JSONB,
        comment: 'Individual rewards based on contribution',
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('portal_bosses', ['portal_id'], {
      name: 'idx_portal_bosses_portal',
    });

    await queryInterface.addIndex('portal_bosses', ['boss_type'], {
      name: 'idx_portal_bosses_type',
    });

    await queryInterface.addIndex('portal_bosses', ['defeated'], {
      name: 'idx_portal_bosses_defeated',
    });

    await queryInterface.addIndex('portal_boss_attempts', ['boss_id'], {
      name: 'idx_boss_attempts_boss',
    });

    await queryInterface.addIndex('portal_boss_attempts', ['user_id'], {
      name: 'idx_boss_attempts_user',
    });

    await queryInterface.addIndex('portal_boss_attempts', ['result'], {
      name: 'idx_boss_attempts_result',
    });

    await queryInterface.addIndex('portal_alliance_raids', ['boss_id'], {
      name: 'idx_alliance_raids_boss',
    });

    await queryInterface.addIndex('portal_alliance_raids', ['alliance_id'], {
      name: 'idx_alliance_raids_alliance',
    });

    await queryInterface.addIndex('portal_alliance_raids', ['status'], {
      name: 'idx_alliance_raids_status',
    });

    await queryInterface.addIndex('portal_raid_participants', ['raid_id'], {
      name: 'idx_raid_participants_raid',
    });

    await queryInterface.addIndex('portal_raid_participants', ['user_id'], {
      name: 'idx_raid_participants_user',
    });

    await queryInterface.addConstraint('portal_raid_participants', {
      fields: ['raid_id', 'user_id'],
      type: 'unique',
      name: 'unique_raid_participant',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('portal_raid_participants');
    await queryInterface.dropTable('portal_alliance_raids');
    await queryInterface.dropTable('portal_boss_attempts');
    await queryInterface.dropTable('portal_bosses');
  },
};
