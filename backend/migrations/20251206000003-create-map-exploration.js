'use strict';

/**
 * Migration: Système d'exploration (fog of war)
 * Permet de tracker quelles zones de la carte ont été explorées par chaque joueur
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('map_exploration', {
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
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      explored_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index composé pour éviter les doublons et recherche rapide
    await queryInterface.addIndex('map_exploration', ['user_id', 'latitude', 'longitude'], {
      unique: true,
      name: 'map_exploration_user_coords_unique',
    });

    // Index pour recherche par utilisateur
    await queryInterface.addIndex('map_exploration', ['user_id'], {
      name: 'map_exploration_user_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('map_exploration');
  },
};
