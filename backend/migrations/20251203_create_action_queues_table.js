'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('action_queues', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('research', 'training', 'defense'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('queued', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'queued',
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finishTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      slot: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('action_queues');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_action_queues_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_action_queues_status";');
  },
};
