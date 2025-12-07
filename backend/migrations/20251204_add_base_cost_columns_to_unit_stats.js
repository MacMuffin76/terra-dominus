'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('unit_stats', 'base_cost_metal', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('unit_stats', 'base_cost_gold', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('unit_stats', 'base_cost_fuel', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('unit_stats', 'base_cost_metal');
    await queryInterface.removeColumn('unit_stats', 'base_cost_gold');
    await queryInterface.removeColumn('unit_stats', 'base_cost_fuel');
  },
};
