const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'chatController' });

/**
 * Chat Controller - HTTP endpoints for chat
 */
const chatController = ({ chatService }) => {
  /**
   * GET /api/v1/chat/messages
   * Get messages for a channel
   */
  const getMessages = async (req, res) => {
    try {
      const { channelType = 'global', channelId, limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;

      // Validation
      if (!['global', 'alliance'].includes(channelType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid channel type. Must be global or alliance.',
        });
      }

      // If alliance channel, verify user is in alliance
      if (channelType === 'alliance') {
        if (!channelId) {
          return res.status(400).json({
            success: false,
            message: 'Alliance channel requires channelId',
          });
        }

        // TODO: Verify user is member of alliance
        // const user = await User.findByPk(userId);
        // if (user.allianceId !== parseInt(channelId)) {
        //   return res.status(403).json({ success: false, message: 'Not a member of this alliance' });
        // }
      }

      const result = await chatService.getMessages(
        channelType,
        channelId ? parseInt(channelId) : null,
        parseInt(limit),
        parseInt(offset)
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in getMessages', { error: error.message, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message,
      });
    }
  };

  /**
   * POST /api/v1/chat/messages
   * Send a message (HTTP fallback, prefer Socket.IO)
   */
  const sendMessage = async (req, res) => {
    try {
      const { channelType = 'global', channelId, message, metadata = {} } = req.body;
      const userId = req.user.id;

      // Validation
      if (!['global', 'alliance'].includes(channelType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid channel type. Must be global or alliance.',
        });
      }

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty',
        });
      }

      // If alliance channel, verify user is in alliance
      if (channelType === 'alliance') {
        if (!channelId) {
          return res.status(400).json({
            success: false,
            message: 'Alliance channel requires channelId',
          });
        }

        // TODO: Verify user is member of alliance
      }

      const createdMessage = await chatService.sendMessage(
        userId,
        channelType,
        message,
        channelId ? parseInt(channelId) : null,
        metadata
      );

      // Broadcast via Socket.IO
      const io = require('../socket').getIO();
      if (io) {
        const room = channelType === 'global' ? 'chat:global' : `chat:alliance:${channelId}`;
        io.to(room).emit('chat:message', {
          id: createdMessage.id,
          userId: createdMessage.userId,
          username: req.user.username,
          channelType: createdMessage.channelType,
          channelId: createdMessage.channelId,
          message: createdMessage.message,
          metadata: createdMessage.metadata,
          createdAt: createdMessage.createdAt,
        });
      }

      return res.status(201).json({
        success: true,
        data: createdMessage,
      });
    } catch (error) {
      logger.error('Error in sendMessage', { error: error.message, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message',
      });
    }
  };

  /**
   * PUT /api/v1/chat/messages/:messageId
   * Edit a message
   */
  const editMessage = async (req, res) => {
    try {
      const { messageId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty',
        });
      }

      const updatedMessage = await chatService.editMessage(
        parseInt(messageId),
        userId,
        message
      );

      // Broadcast edit via Socket.IO
      const io = require('../socket').getIO();
      if (io) {
        const room =
          updatedMessage.channelType === 'global'
            ? 'chat:global'
            : `chat:alliance:${updatedMessage.channelId}`;
        io.to(room).emit('chat:message:edited', {
          id: updatedMessage.id,
          message: updatedMessage.message,
          editedAt: updatedMessage.editedAt,
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedMessage,
      });
    } catch (error) {
      logger.error('Error in editMessage', { error: error.message, userId: req.user?.id });
      return res.status(error.message === 'Message not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to edit message',
      });
    }
  };

  /**
   * DELETE /api/v1/chat/messages/:messageId
   * Delete a message
   */
  const deleteMessage = async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin'; // Assuming role field exists

      const deleted = await chatService.deleteMessage(parseInt(messageId), userId, isAdmin);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      // Broadcast deletion via Socket.IO
      const io = require('../socket').getIO();
      if (io) {
        // Note: We need to know the channel to broadcast to
        // This is a simplified version - in production, fetch message first
        io.emit('chat:message:deleted', {
          id: parseInt(messageId),
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteMessage', { error: error.message, userId: req.user?.id });
      return res.status(error.message === 'Message not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete message',
      });
    }
  };

  return {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
  };
};

module.exports = chatController;
