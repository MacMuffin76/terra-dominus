'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('resources', 'last_update', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()'),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('resources', 'last_update');
  }
};
