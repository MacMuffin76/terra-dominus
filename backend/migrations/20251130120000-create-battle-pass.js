'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create battle_pass_seasons table
    await queryInterface.createTable('battle_pass_seasons', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      season_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        comment: 'Season number (1, 2, 3, etc.)'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Season name/theme'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Season description'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Season start date'
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Season end date'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this season is currently active'
      },
      max_tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Maximum tier level in this season'
      },
      xp_per_tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1000,
        comment: 'XP required per tier'
      },
      premium_price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Cost in gems/premium currency for premium pass'
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

    // Create battle_pass_rewards table
    await queryInterface.createTable('battle_pass_rewards', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      season_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'battle_pass_seasons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to battle_pass_seasons'
      },
      tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Tier level (1-100)'
      },
      track: {
        type: Sequelize.ENUM('free', 'premium'),
        allowNull: false,
        comment: 'Free or premium track'
      },
      reward_type: {
        type: Sequelize.ENUM(
          'resources',      // or, metal, carburant
          'units',          // specific units
          'buildings',      // building blueprints
          'boost',          // production/training boosts
          'cosmetic',       // avatars, badges, titles
          'blueprint',      // research or facility blueprints
          'item',           // special items
          'xp',             // bonus XP
          'gems'            // premium currency
        ),
        allowNull: false,
        comment: 'Type of reward'
      },
      reward_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Reward details (type-specific data)'
      },
      display_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Display name for the reward'
      },
      display_icon: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Icon/emoji for display'
      },
      is_highlight: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this reward should be highlighted'
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

    // Create user_battle_pass table
    await queryInterface.createTable('user_battle_pass', {
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
        onDelete: 'CASCADE',
        comment: 'Foreign key to users'
      },
      season_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'battle_pass_seasons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to battle_pass_seasons'
      },
      current_tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Current tier level'
      },
      current_xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'XP progress in current tier'
      },
      total_xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total XP earned this season'
      },
      has_premium: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether user has premium pass'
      },
      premium_purchased_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When premium was purchased'
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

    // Create user_battle_pass_rewards table
    await queryInterface.createTable('user_battle_pass_rewards', {
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
        onDelete: 'CASCADE',
        comment: 'Foreign key to users'
      },
      season_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'battle_pass_seasons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to battle_pass_seasons'
      },
      reward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'battle_pass_rewards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to battle_pass_rewards'
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When reward was claimed'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('battle_pass_seasons', ['is_active']);
    await queryInterface.addIndex('battle_pass_seasons', ['season_number'], { unique: true });
    await queryInterface.addIndex('battle_pass_seasons', ['start_date', 'end_date']);

    await queryInterface.addIndex('battle_pass_rewards', ['season_id']);
    await queryInterface.addIndex('battle_pass_rewards', ['tier']);
    await queryInterface.addIndex('battle_pass_rewards', ['track']);
    await queryInterface.addIndex('battle_pass_rewards', ['season_id', 'tier', 'track']);

    await queryInterface.addIndex('user_battle_pass', ['user_id']);
    await queryInterface.addIndex('user_battle_pass', ['season_id']);
    await queryInterface.addIndex('user_battle_pass', ['user_id', 'season_id'], { unique: true });

    await queryInterface.addIndex('user_battle_pass_rewards', ['user_id']);
    await queryInterface.addIndex('user_battle_pass_rewards', ['season_id']);
    await queryInterface.addIndex('user_battle_pass_rewards', ['reward_id']);
    await queryInterface.addIndex('user_battle_pass_rewards', ['user_id', 'reward_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_battle_pass_rewards');
    await queryInterface.dropTable('user_battle_pass');
    await queryInterface.dropTable('battle_pass_rewards');
    await queryInterface.dropTable('battle_pass_seasons');
  }
};
