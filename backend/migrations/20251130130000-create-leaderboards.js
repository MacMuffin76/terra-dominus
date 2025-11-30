'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Table pour les entrées de leaderboard
    await queryInterface.createTable('leaderboard_entries', {
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
      category: {
        type: Sequelize.ENUM(
          'total_power',      // Puissance militaire totale
          'economy',          // Volume d'échanges économiques
          'combat_victories', // Nombre de victoires en combat
          'buildings',        // Niveau total des bâtiments
          'research',         // Niveau de recherche
          'resources',        // Ressources totales produites
          'portals',          // Portails complétés (pour future)
          'achievements',     // Points d'achievements
          'battle_pass'       // Tier Battle Pass
        ),
        allowNull: false
      },
      score: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true // Calculé dynamiquement
      },
      previous_rank: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Index composite pour requêtes rapides par catégorie + score
    await queryInterface.addIndex('leaderboard_entries', ['category', 'score'], {
      name: 'idx_leaderboard_category_score'
    });

    // Index pour user_id + category (unique entry par user par catégorie)
    await queryInterface.addIndex('leaderboard_entries', ['user_id', 'category'], {
      name: 'idx_leaderboard_user_category',
      unique: true
    });

    // Index pour rank
    await queryInterface.addIndex('leaderboard_entries', ['category', 'rank'], {
      name: 'idx_leaderboard_category_rank'
    });

    // Table pour les récompenses de leaderboard (saisonnier)
    await queryInterface.createTable('leaderboard_rewards', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      category: {
        type: Sequelize.ENUM(
          'total_power',
          'economy',
          'combat_victories',
          'buildings',
          'research',
          'resources',
          'portals',
          'achievements',
          'battle_pass'
        ),
        allowNull: false
      },
      season_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Null = permanent, sinon lié à une saison
        comment: 'ID de la saison (future implementation)'
      },
      rank_min: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Rang minimum pour cette récompense'
      },
      rank_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Rang maximum pour cette récompense'
      },
      reward_type: {
        type: Sequelize.ENUM(
          'premium_currency',
          'resources',
          'cosmetic',
          'title',
          'badge',
          'unit',
          'building_skin',
          'boost'
        ),
        allowNull: false
      },
      reward_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Données spécifiques à la récompense'
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      display_icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Index pour category + season_id
    await queryInterface.addIndex('leaderboard_rewards', ['category', 'season_id'], {
      name: 'idx_leaderboard_rewards_category_season'
    });

    // Table pour tracker les récompenses réclamées
    await queryInterface.createTable('user_leaderboard_rewards', {
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
      reward_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'leaderboard_rewards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      season_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rank_achieved: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Rang atteint pour obtenir cette récompense'
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Index pour user_id + reward_id (éviter doubles réclamations)
    await queryInterface.addIndex('user_leaderboard_rewards', ['user_id', 'reward_id', 'season_id'], {
      name: 'idx_user_leaderboard_rewards_unique',
      unique: true
    });

    console.log('✓ Leaderboard tables created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_leaderboard_rewards');
    await queryInterface.dropTable('leaderboard_rewards');
    await queryInterface.dropTable('leaderboard_entries');
    
    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leaderboard_entries_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leaderboard_rewards_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leaderboard_rewards_reward_type";');
    
    console.log('✓ Leaderboard tables dropped');
  }
};
