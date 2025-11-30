'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'protection_shield_until', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Protection shield expiration date for new players (72h from registration)'
    });

    await queryInterface.addColumn('users', 'attacks_sent_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total attacks sent by user (used to remove shield if user is aggressive)'
    });

    // Index for quick shield checks
    await queryInterface.addIndex('users', ['protection_shield_until'], {
      name: 'idx_users_protection_shield'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_protection_shield');
    await queryInterface.removeColumn('users', 'attacks_sent_count');
    await queryInterface.removeColumn('users', 'protection_shield_until');
  }
};
