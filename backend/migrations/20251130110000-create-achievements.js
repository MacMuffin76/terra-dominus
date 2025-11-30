// 20251130110000-create-achievements.js - Create achievements tables
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create achievements table (achievement definitions)
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the achievement',
      },
      category: {
        type: Sequelize.ENUM('combat', 'economy', 'buildings', 'research', 'social', 'exploration', 'general'),
        allowNull: false,
        comment: 'Achievement category',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Achievement title',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Achievement description',
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
        allowNull: false,
        defaultValue: 'bronze',
        comment: 'Achievement tier/rarity',
      },
      objective_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of objective (e.g., total_battles_won, total_resources_collected)',
      },
      objective_target: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Target value to unlock achievement',
      },
      objective_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional objective data (e.g., specific resource type)',
      },
      reward_or: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Gold reward',
      },
      reward_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Metal reward',
      },
      reward_carburant: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Fuel reward',
      },
      reward_xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'XP reward',
      },
      reward_items: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Item rewards (JSON array)',
      },
      reward_title: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Special title/badge reward',
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Achievement points for leaderboard',
      },
      is_secret: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether achievement is hidden until unlocked',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether achievement is currently available',
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Icon identifier',
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

    // Create user_achievements table (user progress)
    await queryInterface.createTable('user_achievements', {
      id: {
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
        onUpdate: 'CASCADE',
      },
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current progress towards objective',
      },
      unlocked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When achievement was unlocked',
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When rewards were claimed',
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

    // Add indexes for performance
    await queryInterface.addIndex('achievements', ['category']);
    await queryInterface.addIndex('achievements', ['tier']);
    await queryInterface.addIndex('achievements', ['is_active']);
    await queryInterface.addIndex('achievements', ['key'], { unique: true });
    
    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addIndex('user_achievements', ['achievement_id']);
    await queryInterface.addIndex('user_achievements', ['user_id', 'achievement_id'], { unique: true });
    await queryInterface.addIndex('user_achievements', ['unlocked_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_achievements');
    await queryInterface.dropTable('achievements');
  },
};
