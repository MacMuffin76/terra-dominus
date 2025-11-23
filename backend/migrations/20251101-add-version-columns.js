'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('resources', 'version', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('buildings', 'version', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('buildings', 'version');
    await queryInterface.removeColumn('resources', 'version');
  }
};