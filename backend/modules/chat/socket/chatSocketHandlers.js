const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'chatSocketHandlers' });

/**
 * Chat Socket Handlers - Real-time chat via Socket.IO
 */
const registerChatHandlers = (io, socket, { chatService }) => {
  const userId = socket.user.id;

  logger.info('User connected to chat', { userId, socketId: socket.id });

  /**
   * Join global chat room
   */
  socket.on('chat:join:global', () => {
    socket.join('chat:global');
    logger.info('User joined global chat', { userId });

    socket.emit('chat:joined', {
      channel: 'global',
      message: 'Connected to global chat',
    });
  });

  /**
   * Join alliance chat room
   */
  socket.on('chat:join:alliance', async (data) => {
    try {
      const { allianceId } = data;

      if (!allianceId) {
        return socket.emit('chat:error', {
          message: 'Alliance ID is required',
        });
      }

      // TODO: Verify user is member of alliance
      // const user = await User.findByPk(userId);
      // if (!user || user.allianceId !== allianceId) {
      //   return socket.emit('chat:error', { message: 'Not a member of this alliance' });
      // }

      const roomName = `chat:alliance:${allianceId}`;
      socket.join(roomName);

      logger.info('User joined alliance chat', { userId, allianceId });

      socket.emit('chat:joined', {
        channel: 'alliance',
        allianceId,
        message: `Connected to alliance chat`,
      });
    } catch (error) {
      logger.error('Error joining alliance chat', { error: error.message, userId });
      socket.emit('chat:error', { message: 'Failed to join alliance chat' });
    }
  });

  /**
   * Leave a chat room
   */
  socket.on('chat:leave', (data) => {
    const { channelType, channelId } = data;

    if (channelType === 'global') {
      socket.leave('chat:global');
      logger.info('User left global chat', { userId });
    } else if (channelType === 'alliance' && channelId) {
      socket.leave(`chat:alliance:${channelId}`);
      logger.info('User left alliance chat', { userId, allianceId: channelId });
    }

    socket.emit('chat:left', { channelType, channelId });
  });

  /**
   * Send a message
   */
  socket.on('chat:send', async (data) => {
    try {
      const { channelType = 'global', channelId, message, metadata = {} } = data;

      // Validation
      if (!['global', 'alliance'].includes(channelType)) {
        return socket.emit('chat:error', {
          message: 'Invalid channel type',
        });
      }

      if (!message || message.trim().length === 0) {
        return socket.emit('chat:error', {
          message: 'Message cannot be empty',
        });
      }

      // If alliance channel, verify user is in alliance
      if (channelType === 'alliance') {
        if (!channelId) {
          return socket.emit('chat:error', {
            message: 'Alliance channel requires channelId',
          });
        }

        // TODO: Verify user is member of alliance
      }

      // Save message to database
      const createdMessage = await chatService.sendMessage(
        userId,
        channelType,
        message,
        channelId || null,
        metadata
      );

      // Fetch user info for broadcast
      const { User } = require('../../../models');
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username'],
      });

      // Broadcast to room
      const room = channelType === 'global' ? 'chat:global' : `chat:alliance:${channelId}`;
      
      const messagePayload = {
        id: createdMessage.id,
        userId: createdMessage.userId,
        username: user.username,
        channelType: createdMessage.channelType,
        channelId: createdMessage.channelId,
        message: createdMessage.message,
        metadata: createdMessage.metadata,
        createdAt: createdMessage.createdAt,
      };

      io.to(room).emit('chat:message', messagePayload);

      logger.info('Chat message sent', {
        messageId: createdMessage.id,
        userId,
        channelType,
        channelId,
      });
    } catch (error) {
      logger.error('Error sending chat message', {
        error: error.message,
        userId,
        data,
      });

      socket.emit('chat:error', {
        message: error.message || 'Failed to send message',
      });
    }
  });

  /**
   * Edit a message
   */
  socket.on('chat:edit', async (data) => {
    try {
      const { messageId, newMessage } = data;

      if (!messageId || !newMessage) {
        return socket.emit('chat:error', {
          message: 'Message ID and new message content are required',
        });
      }

      const updatedMessage = await chatService.editMessage(
        messageId,
        userId,
        newMessage
      );

      // Broadcast to room
      const room =
        updatedMessage.channelType === 'global'
          ? 'chat:global'
          : `chat:alliance:${updatedMessage.channelId}`;

      io.to(room).emit('chat:message:edited', {
        id: updatedMessage.id,
        message: updatedMessage.message,
        editedAt: updatedMessage.editedAt,
      });

      logger.info('Chat message edited', { messageId, userId });
    } catch (error) {
      logger.error('Error editing chat message', {
        error: error.message,
        userId,
        data,
      });

      socket.emit('chat:error', {
        message: error.message || 'Failed to edit message',
      });
    }
  });

  /**
   * Delete a message
   */
  socket.on('chat:delete', async (data) => {
    try {
      const { messageId } = data;

      if (!messageId) {
        return socket.emit('chat:error', {
          message: 'Message ID is required',
        });
      }

      // Fetch message to get channel info before deletion
      const { ChatMessage } = require('../models');
      const message = await ChatMessage.findByPk(messageId);

      if (!message) {
        return socket.emit('chat:error', {
          message: 'Message not found',
        });
      }

      const isAdmin = false; // TODO: Check user role
      const deleted = await chatService.deleteMessage(messageId, userId, isAdmin);

      if (!deleted) {
        return socket.emit('chat:error', {
          message: 'Failed to delete message',
        });
      }

      // Broadcast to room
      const room =
        message.channelType === 'global'
          ? 'chat:global'
          : `chat:alliance:${message.channelId}`;

      io.to(room).emit('chat:message:deleted', {
        id: messageId,
      });

      logger.info('Chat message deleted', { messageId, userId });
    } catch (error) {
      logger.error('Error deleting chat message', {
        error: error.message,
        userId,
        data,
      });

      socket.emit('chat:error', {
        message: error.message || 'Failed to delete message',
      });
    }
  });

  /**
   * User is typing indicator
   */
  socket.on('chat:typing', (data) => {
    const { channelType, channelId, isTyping } = data;

    const room = channelType === 'global' ? 'chat:global' : `chat:alliance:${channelId}`;

    socket.to(room).emit('chat:user:typing', {
      userId,
      channelType,
      channelId,
      isTyping,
    });
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    logger.info('User disconnected from chat', { userId, socketId: socket.id });
  });
};

module.exports = registerChatHandlers;
