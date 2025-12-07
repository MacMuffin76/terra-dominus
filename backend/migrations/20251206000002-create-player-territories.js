'use strict';

/**
 * Migration: Système de territoires pour la carte Leaflet
 * Permet aux joueurs de revendiquer des zones sur la carte procédurale
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('player_territories', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Latitude du centre du territoire',
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Longitude du centre du territoire',
      },
      radius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        comment: 'Rayon du territoire en unités de carte',
      },
      terrain_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type de terrain dominant (plains, forest, mountain, etc.)',
      },
      resource_bonus: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Bonus de ressources par heure {metal: 10, crystal: 5, ...}',
      },
      defense_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Niveau de défense du territoire',
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    // Index pour recherche par joueur
    await queryInterface.addIndex('player_territories', ['user_id'], {
      name: 'player_territories_user_id_idx',
    });

    // Index pour recherche géographique
    await queryInterface.addIndex('player_territories', ['latitude', 'longitude'], {
      name: 'player_territories_coords_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('player_territories');
  },
};
