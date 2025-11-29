'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne specialization avec ENUM
    await queryInterface.addColumn('cities', 'specialization', {
      type: Sequelize.ENUM('none', 'military', 'economic', 'industrial', 'research'),
      allowNull: false,
      defaultValue: 'none',
      comment: 'City specialization type providing specific bonuses'
    });

    // Ajouter la colonne specialized_at pour suivre quand la spécialisation a été choisie
    await queryInterface.addColumn('cities', 'specialized_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when the city was specialized'
    });

    // Ajouter index pour recherche rapide
    await queryInterface.addIndex('cities', ['specialization'], {
      name: 'idx_cities_specialization'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer l'index
    await queryInterface.removeIndex('cities', 'idx_cities_specialization');

    // Supprimer les colonnes
    await queryInterface.removeColumn('cities', 'specialized_at');
    await queryInterface.removeColumn('cities', 'specialization');

    // Supprimer l'ENUM type (PostgreSQL)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_cities_specialization";'
    );
  }
};
