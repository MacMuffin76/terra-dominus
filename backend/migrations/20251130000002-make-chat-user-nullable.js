'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make user_id nullable for system messages
    await queryInterface.changeColumn('chat_messages', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Changed from false to true
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Changed from CASCADE to SET NULL
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to non-nullable
    await queryInterface.changeColumn('chat_messages', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
