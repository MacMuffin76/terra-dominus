'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if portal_attempts exists
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('portal_attempts')) {
      // Create portal_attempts table
      await queryInterface.createTable('portal_attempts', {
        id: {
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
          comment: 'Units composition sent: { Infantry: 50, Tank: 10 }',
        },
        result: {
          type: Sequelize.ENUM('victory', 'defeat', 'retreat'),
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
          comment: 'Resources and items obtained',
        },
        battle_duration: {
          type: Sequelize.INTEGER,
          comment: 'Battle duration in seconds',
        },
        tactic_used: {
          type: Sequelize.ENUM('balanced', 'aggressive', 'defensive'),
          defaultValue: 'balanced',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('portal_attempts', ['user_id'], {
        name: 'idx_attempts_user',
      });
      await queryInterface.addIndex('portal_attempts', ['portal_id'], {
        name: 'idx_attempts_portal',
      });
      await queryInterface.addIndex('portal_attempts', ['result'], {
        name: 'idx_attempts_result',
      });
    }

    if (!tables.includes('portal_mastery')) {
      // Create portal_mastery table
      await queryInterface.createTable('portal_mastery', {
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
        },
        tier: {
          type: Sequelize.ENUM('grey', 'green', 'blue', 'purple', 'red', 'golden'),
          allowNull: false,
        },
        clears: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of successful clears',
        },
        fastest_time: {
          type: Sequelize.INTEGER,
          comment: 'Fastest clear time in seconds',
        },
        total_rewards: {
          type: Sequelize.JSONB,
          comment: 'Total rewards earned from this tier',
        },
        mastery_level: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Mastery level 0-4',
        },
        last_clear: {
          type: Sequelize.DATE,
          comment: 'Timestamp of last successful clear',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addConstraint('portal_mastery', {
        fields: ['user_id', 'tier'],
        type: 'unique',
        name: 'unique_user_tier',
      });

      await queryInterface.addIndex('portal_mastery', ['user_id'], {
        name: 'idx_mastery_user',
      });
      await queryInterface.addIndex('portal_mastery', ['tier'], {
        name: 'idx_mastery_tier',
      });
      await queryInterface.addIndex('portal_mastery', ['mastery_level'], {
        name: 'idx_mastery_level',
      });
    }

    if (!tables.includes('portal_leaderboard')) {
      // Create portal_leaderboard table
      await queryInterface.createTable('portal_leaderboard', {
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
        },
        tier: {
          type: Sequelize.ENUM('grey', 'green', 'blue', 'purple', 'red', 'golden'),
          allowNull: false,
        },
        total_clears: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        fastest_time: {
          type: Sequelize.INTEGER,
          comment: 'Fastest clear time in seconds',
        },
        highest_difficulty: {
          type: Sequelize.INTEGER,
          comment: 'Highest difficulty cleared',
        },
        season: {
          type: Sequelize.STRING(50),
          defaultValue: 'season_1',
        },
        points: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Leaderboard points',
        },
        rank: {
          type: Sequelize.INTEGER,
          comment: 'Current rank in tier',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('portal_leaderboard', ['tier', 'season', 'points'], {
        name: 'idx_leaderboard_ranking',
      });
      await queryInterface.addIndex('portal_leaderboard', ['user_id'], {
        name: 'idx_leaderboard_user',
      });
    }

    if (!tables.includes('portal_rewards_config')) {
      // Create portal_rewards_config table
      await queryInterface.createTable('portal_rewards_config', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tier: {
          type: Sequelize.ENUM('grey', 'green', 'blue', 'purple', 'red', 'golden'),
          allowNull: false,
        },
        difficulty: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        base_resources: {
          type: Sequelize.JSONB,
          comment: 'Base resource rewards',
        },
        special_items_pool: {
          type: Sequelize.JSONB,
          comment: 'Pool of special items with drop rates',
        },
        experience_reward: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addConstraint('portal_rewards_config', {
        fields: ['tier', 'difficulty'],
        type: 'unique',
        name: 'unique_tier_difficulty',
      });

      // Seed initial reward configurations
      await queryInterface.bulkInsert('portal_rewards_config', [
        // Grey tier
        { tier: 'grey', difficulty: 1, base_resources: JSON.stringify({ metal: 500, crystal: 300, deuterium: 200 }), special_items_pool: JSON.stringify([]), experience_reward: 50, created_at: new Date(), updated_at: new Date() },
        { tier: 'grey', difficulty: 2, base_resources: JSON.stringify({ metal: 800, crystal: 500, deuterium: 350 }), special_items_pool: JSON.stringify([]), experience_reward: 75, created_at: new Date(), updated_at: new Date() },
        // Green tier
        { tier: 'green', difficulty: 3, base_resources: JSON.stringify({ metal: 1500, crystal: 1000, deuterium: 700 }), special_items_pool: JSON.stringify([{ item: 'rare_blueprint', chance: 0.05 }]), experience_reward: 150, created_at: new Date(), updated_at: new Date() },
        { tier: 'green', difficulty: 4, base_resources: JSON.stringify({ metal: 2500, crystal: 1800, deuterium: 1200 }), special_items_pool: JSON.stringify([{ item: 'rare_blueprint', chance: 0.08 }]), experience_reward: 200, created_at: new Date(), updated_at: new Date() },
        // Blue tier
        { tier: 'blue', difficulty: 5, base_resources: JSON.stringify({ metal: 5000, crystal: 3500, deuterium: 2500 }), special_items_pool: JSON.stringify([{ item: 'epic_blueprint', chance: 0.10 }, { item: 'tech_fragment', chance: 0.15 }]), experience_reward: 400, created_at: new Date(), updated_at: new Date() },
        { tier: 'blue', difficulty: 6, base_resources: JSON.stringify({ metal: 8000, crystal: 6000, deuterium: 4000 }), special_items_pool: JSON.stringify([{ item: 'epic_blueprint', chance: 0.15 }, { item: 'tech_fragment', chance: 0.20 }]), experience_reward: 600, created_at: new Date(), updated_at: new Date() },
        // Purple tier
        { tier: 'purple', difficulty: 7, base_resources: JSON.stringify({ metal: 15000, crystal: 12000, deuterium: 8000 }), special_items_pool: JSON.stringify([{ item: 'legendary_blueprint', chance: 0.05 }, { item: 'hero_fragment', chance: 0.08 }, { item: 'artifact_piece', chance: 0.10 }]), experience_reward: 1000, created_at: new Date(), updated_at: new Date() },
        { tier: 'purple', difficulty: 8, base_resources: JSON.stringify({ metal: 25000, crystal: 20000, deuterium: 15000 }), special_items_pool: JSON.stringify([{ item: 'legendary_blueprint', chance: 0.10 }, { item: 'hero_fragment', chance: 0.12 }, { item: 'artifact_piece', chance: 0.15 }]), experience_reward: 1500, created_at: new Date(), updated_at: new Date() },
        // Red tier
        { tier: 'red', difficulty: 9, base_resources: JSON.stringify({ metal: 50000, crystal: 40000, deuterium: 30000 }), special_items_pool: JSON.stringify([{ item: 'mythic_blueprint', chance: 0.05 }, { item: 'legendary_hero', chance: 0.03 }, { item: 'unique_artifact', chance: 0.08 }]), experience_reward: 3000, created_at: new Date(), updated_at: new Date() },
        { tier: 'red', difficulty: 10, base_resources: JSON.stringify({ metal: 100000, crystal: 80000, deuterium: 60000 }), special_items_pool: JSON.stringify([{ item: 'mythic_blueprint', chance: 0.10 }, { item: 'legendary_hero', chance: 0.05 }, { item: 'unique_artifact', chance: 0.12 }]), experience_reward: 5000, created_at: new Date(), updated_at: new Date() },
        // Golden tier
        { tier: 'golden', difficulty: 10, base_resources: JSON.stringify({ metal: 500000, crystal: 400000, deuterium: 300000 }), special_items_pool: JSON.stringify([{ item: 'exclusive_hero', chance: 0.15 }, { item: 'golden_artifact', chance: 0.20 }, { item: 'world_first_title', chance: 0.05 }]), experience_reward: 25000, created_at: new Date(), updated_at: new Date() },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('portal_rewards_config');
    await queryInterface.dropTable('portal_leaderboard');
    await queryInterface.dropTable('portal_mastery');
    await queryInterface.dropTable('portal_attempts');
  },
};
