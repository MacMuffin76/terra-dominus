'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'last_login', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp de la dernière connexion pour calcul de rattrapage offline'
    });

    await queryInterface.addColumn('users', 'last_logout', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp de la dernière déconnexion pour calcul de rattrapage offline'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'last_login');
    await queryInterface.removeColumn('users', 'last_logout');
  }
};
