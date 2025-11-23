'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('construction_queue', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('queued', 'in_progress', 'cancelled', 'completed'),
        allowNull: false,
        defaultValue: 'queued',
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finish_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      slot: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('construction_queue', ['city_id']);
    await queryInterface.addIndex('construction_queue', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('construction_queue', ['status']);
    await queryInterface.removeIndex('construction_queue', ['city_id']);
    await queryInterface.dropTable('construction_queue');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_construction_queue_status\";");
  },
};