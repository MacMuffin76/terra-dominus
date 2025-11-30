const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define(
    'ChatMessage',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable for system messages
        field: 'user_id',
      },
      channelType: {
        type: DataTypes.ENUM('global', 'alliance', 'private', 'system'),
        allowNull: false,
        defaultValue: 'global',
        field: 'channel_type',
      },
      channelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'channel_id',
        comment: 'Alliance ID for alliance channel, NULL for global',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'edited_at',
      },
    },
    {
      tableName: 'chat_messages',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['channel_type', 'channel_id', 'created_at'],
          name: 'idx_chat_messages_channel_created',
        },
        {
          fields: ['user_id', 'created_at'],
          name: 'idx_chat_messages_user_created',
        },
      ],
    }
  );

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author',
    });

    // Alliance association (optional, only for alliance channels)
    if (models.Alliance) {
      ChatMessage.belongsTo(models.Alliance, {
        foreignKey: 'channelId',
        as: 'alliance',
        constraints: false,
      });
    }
  };

  return ChatMessage;
};
