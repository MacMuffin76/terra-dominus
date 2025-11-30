'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Table des définitions de quêtes
    await queryInterface.createTable('quests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Identifiant unique de la quête (ex: daily_train_units)'
      },
      type: {
        type: Sequelize.ENUM('daily', 'weekly', 'achievement'),
        allowNull: false,
        defaultValue: 'daily',
        comment: 'Type de quête (journalière, hebdomadaire, succès)'
      },
      category: {
        type: Sequelize.ENUM('combat', 'economy', 'buildings', 'research', 'social'),
        allowNull: false,
        comment: 'Catégorie de la quête'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Titre de la quête'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Description de la quête'
      },
      objective_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type d\'objectif (train_units, collect_resources, upgrade_building, etc.)'
      },
      objective_target: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Cible à atteindre (quantité)'
      },
      objective_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Données supplémentaires pour l\'objectif (ex: {unit_type: "Infantry"})'
      },
      reward_or: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reward_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reward_carburant: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reward_xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reward_items: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Récompenses additionnelles (unités, items spéciaux, etc.)'
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'epic'),
        allowNull: false,
        defaultValue: 'easy',
        comment: 'Difficulté de la quête'
      },
      min_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Niveau minimum requis pour débloquer la quête'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Quête active dans le système'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Icône de la quête (emoji ou path)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Table de progression des quêtes utilisateur
    await queryInterface.createTable('user_quests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      quest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('available', 'in_progress', 'completed', 'claimed'),
        allowNull: false,
        defaultValue: 'available',
        comment: 'Statut de la quête pour l\'utilisateur'
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Progression actuelle (0 à objective_target)'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de début de la quête'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de complétion de la quête'
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de réclamation des récompenses'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date d\'expiration (pour quêtes journalières/hebdomadaires)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexes pour performance
    await queryInterface.addIndex('quests', ['type', 'is_active']);
    await queryInterface.addIndex('quests', ['category']);
    await queryInterface.addIndex('quests', ['key'], { unique: true });
    
    await queryInterface.addIndex('user_quests', ['user_id', 'status']);
    await queryInterface.addIndex('user_quests', ['user_id', 'quest_id'], { unique: true });
    await queryInterface.addIndex('user_quests', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_quests');
    await queryInterface.dropTable('quests');
  }
};
