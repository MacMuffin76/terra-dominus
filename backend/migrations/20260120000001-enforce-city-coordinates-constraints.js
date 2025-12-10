'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'cities',
        'coord_x',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'cities',
        'coord_y',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.addIndex('cities', ['coord_x', 'coord_y'], {
        unique: true,
        name: 'cities_coord_unique',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('cities', 'cities_coord_unique', { transaction });

      await queryInterface.changeColumn(
        'cities',
        'coord_x',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'cities',
        'coord_y',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};