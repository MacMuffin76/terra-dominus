'use strict';

/**
 * Migration: Système de carte du monde et exploration
 * Crée les tables pour la grille mondiale, emplacements de villes et exploration
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Table: world_grid - Grille du monde
    await queryInterface.createTable('world_grid', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      coord_x: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      coord_y: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      terrain_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'plains',
        comment: 'Type de terrain: plains, forest, mountain, desert, water',
      },
      has_city_slot: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indique si cette case peut accueillir une ville',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index unique sur les coordonnées
    await queryInterface.addIndex('world_grid', ['coord_x', 'coord_y'], {
      unique: true,
      name: 'world_grid_coords_unique',
    });

    // Index pour les recherches par city_slot
    await queryInterface.addIndex('world_grid', ['has_city_slot'], {
      name: 'world_grid_city_slot_idx',
    });

    // Table: city_slots - Emplacements de villes disponibles
    await queryInterface.createTable('city_slots', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      grid_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'world_grid',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'free',
        comment: 'Status: free, occupied, ruins, reserved',
      },
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quality: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Qualité de l\'emplacement (1-5): affecte bonus ressources',
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

    // Index pour recherche rapide des emplacements libres
    await queryInterface.addIndex('city_slots', ['status'], {
      name: 'city_slots_status_idx',
    });

    // Index unique sur city_id quand occupé
    await queryInterface.addIndex('city_slots', ['city_id'], {
      unique: true,
      name: 'city_slots_city_id_unique',
      where: { city_id: { [Sequelize.Op.ne]: null } },
    });

    // Table: explored_tiles - Brouillard de guerre
    await queryInterface.createTable('explored_tiles', {
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
      grid_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'world_grid',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      explored_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index composite unique: un joueur ne peut explorer une case qu'une fois
    await queryInterface.addIndex('explored_tiles', ['user_id', 'grid_id'], {
      unique: true,
      name: 'explored_tiles_user_grid_unique',
    });

    // Table: colonization_missions - Missions de colonisation en cours
    await queryInterface.createTable('colonization_missions', {
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
      departure_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      target_slot_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'city_slots',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      colonist_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Nombre de colons envoyés',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'traveling',
        comment: 'Status: traveling, arrived, completed, failed, cancelled',
      },
      departure_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      arrival_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Index pour recherche des missions actives
    await queryInterface.addIndex('colonization_missions', ['user_id', 'status'], {
      name: 'colonization_missions_user_status_idx',
    });

    // Index pour les missions par arrival_at (worker processing)
    await queryInterface.addIndex('colonization_missions', ['arrival_at', 'status'], {
      name: 'colonization_missions_arrival_idx',
    });

    // Les colonnes coord_x, coord_y, vision_range et founded_at existent déjà
    // Ajout seulement de l'index si nécessaire
    try {
      await queryInterface.addIndex('cities', ['coord_x', 'coord_y'], {
        name: 'cities_coords_idx',
      });
    } catch (e) {
      // Index existe déjà, on ignore
    }
  },

  async down(queryInterface, Sequelize) {
    // Suppression dans l'ordre inverse (foreign keys)
    await queryInterface.dropTable('colonization_missions');
    await queryInterface.dropTable('explored_tiles');
    await queryInterface.dropTable('city_slots');
    await queryInterface.dropTable('world_grid');

    // Suppression des colonnes ajoutées à cities
    await queryInterface.removeColumn('cities', 'founded_at');
    await queryInterface.removeColumn('cities', 'vision_range');
    await queryInterface.removeColumn('cities', 'coord_y');
    await queryInterface.removeColumn('cities', 'coord_x');
  },
};
