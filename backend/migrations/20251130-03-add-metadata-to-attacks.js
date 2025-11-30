'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attacks', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'PvP balancing metadata (power, cost/reward multipliers)'
    });
    
    console.log('✅ Added metadata column to attacks table for PvP balancing data');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('attacks', 'metadata');
  }
};
