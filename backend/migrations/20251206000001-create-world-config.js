'use strict';

/**
 * Migration: Configuration du monde (seed de génération)
 * Stocke la seed utilisée pour générer la carte procédurale
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('world_config', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      seed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Seed utilisée pour la génération procédurale de la carte',
      },
      map_width: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2400,
      },
      map_height: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 800,
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Version de l\'algorithme de génération',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Métadonnées additionnelles (ratio terre/eau, etc.)',
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

    // Index pour recherche rapide
    await queryInterface.addIndex('world_config', ['seed'], {
      name: 'world_config_seed_idx',
    });

    // Insérer la configuration par défaut
    await queryInterface.bulkInsert('world_config', [
      {
        seed: 12345,
        map_width: 2400,
        map_height: 800,
        version: 1,
        metadata: JSON.stringify({
          algorithm: 'perlin_fbm',
          octaves: 6,
          scale: 0.002,
          land_water_ratio: 0.4,
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('world_config');
  },
};
