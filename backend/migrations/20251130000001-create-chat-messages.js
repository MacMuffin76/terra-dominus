'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('chat_messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      channel_type: {
        type: Sequelize.ENUM('global', 'alliance', 'private', 'system'),
        allowNull: false,
        defaultValue: 'global'
      },
      channel_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Alliance ID for alliance channel, NULL for global'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Attachments, mentions, formatting, etc.'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index for efficient channel queries
    await queryInterface.addIndex('chat_messages', ['channel_type', 'channel_id', 'created_at'], {
      name: 'idx_chat_messages_channel_created'
    });

    // Index for user history
    await queryInterface.addIndex('chat_messages', ['user_id', 'created_at'], {
      name: 'idx_chat_messages_user_created'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('chat_messages');
  }
};
