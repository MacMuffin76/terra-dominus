'use strict';

/**
 * Portal Quest System Migration
 * Creates tables for quest system, user progress tracking, unlocks, and rotations
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. portal_quests - Master quest definitions
    await queryInterface.createTable('portal_quests', {
      quest_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      quest_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['story', 'daily', 'weekly', 'achievement']],
        },
      },
      quest_category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'tutorial, progression, combat, social',
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      
      // Story progression
      chapter: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      order_in_chapter: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      prerequisite_quest_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'portal_quests',
          key: 'quest_id',
        },
        onDelete: 'SET NULL',
      },
      
      // Objectives (JSONB array)
      objectives: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      
      // Rewards (JSONB)
      rewards: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      
      // Availability
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      required_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      required_mastery_tier: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 2. user_quests - Individual player quest progress
    await queryInterface.createTable('user_quests', {
      user_quest_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      quest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'portal_quests',
          key: 'quest_id',
        },
        onDelete: 'CASCADE',
      },
      
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'completed', 'failed', 'abandoned']],
        },
      },
      
      // Progress tracking (JSONB array matching objectives)
      progress: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'For daily/weekly quests',
      },
      
      // Rewards claimed
      rewards_claimed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });

    // 3. user_quest_unlocks - Content unlocked via quests
    await queryInterface.createTable('user_quest_unlocks', {
      unlock_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      unlock_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'portal_tier, feature, blueprint, title',
      },
      unlock_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'blue_portals, alliance_raids, advanced_barracks',
      },
      unlocked_by_quest_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'portal_quests',
          key: 'quest_id',
        },
        onDelete: 'SET NULL',
      },
      unlocked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 4. daily_quest_rotation - Active daily quests
    await queryInterface.createTable('daily_quest_rotation', {
      rotation_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      quest_ids: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        comment: 'Array of 3 quest IDs',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 5. quest_streaks - Daily quest completion streaks
    await queryInterface.createTable('quest_streaks', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      current_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_completed_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Indexes for portal_quests
    await queryInterface.addIndex('portal_quests', ['quest_type'], {
      name: 'idx_portal_quests_type',
    });
    await queryInterface.addIndex('portal_quests', ['chapter'], {
      name: 'idx_portal_quests_chapter',
    });
    await queryInterface.addIndex('portal_quests', ['is_active'], {
      name: 'idx_portal_quests_active',
    });

    // Indexes for user_quests
    await queryInterface.addIndex('user_quests', ['user_id'], {
      name: 'idx_user_quests_user',
    });
    await queryInterface.addIndex('user_quests', ['quest_id'], {
      name: 'idx_user_quests_quest',
    });
    await queryInterface.addIndex('user_quests', ['status'], {
      name: 'idx_user_quests_status',
    });
    await queryInterface.addIndex('user_quests', ['expires_at'], {
      name: 'idx_user_quests_expires',
    });
    
    // Unique constraint for user_quests
    await queryInterface.addConstraint('user_quests', {
      fields: ['user_id', 'quest_id'],
      type: 'unique',
      name: 'unique_user_quest',
    });

    // Indexes for user_quest_unlocks
    await queryInterface.addIndex('user_quest_unlocks', ['user_id'], {
      name: 'idx_user_unlocks_user',
    });
    await queryInterface.addIndex('user_quest_unlocks', ['unlock_type'], {
      name: 'idx_user_unlocks_type',
    });
    
    // Unique constraint for user_quest_unlocks
    await queryInterface.addConstraint('user_quest_unlocks', {
      fields: ['user_id', 'unlock_type', 'unlock_key'],
      type: 'unique',
      name: 'unique_user_unlock',
    });

    // Index for daily_quest_rotation
    await queryInterface.addIndex('daily_quest_rotation', ['date'], {
      name: 'idx_daily_rotation_date',
    });

    console.log('✅ Portal quest system tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order (respect foreign keys)
    await queryInterface.dropTable('quest_streaks');
    await queryInterface.dropTable('daily_quest_rotation');
    await queryInterface.dropTable('user_quest_unlocks');
    await queryInterface.dropTable('user_quests');
    await queryInterface.dropTable('portal_quests');

    console.log('✅ Portal quest system tables dropped');
  },
};
