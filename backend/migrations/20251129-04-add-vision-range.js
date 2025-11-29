'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cities', 'vision_range', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: 'Portée de vision de la ville en tiles'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cities', 'vision_range');
  }
};
