'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cities', 'founded_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: 'Date de fondation de la ville'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cities', 'founded_at');
  }
};
