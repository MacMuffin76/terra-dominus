'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tutorial_progress', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      current_step: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Current tutorial step (1-10)'
      },
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      skipped: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      completed_steps: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of completed step IDs'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('tutorial_progress', ['user_id'], {
      name: 'idx_tutorial_progress_user_id',
      unique: true
    });

    await queryInterface.addIndex('tutorial_progress', ['completed'], {
      name: 'idx_tutorial_progress_completed'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('tutorial_progress', 'idx_tutorial_progress_completed');
    await queryInterface.removeIndex('tutorial_progress', 'idx_tutorial_progress_user_id');
    await queryInterface.dropTable('tutorial_progress');
  }
};
