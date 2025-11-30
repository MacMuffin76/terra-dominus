const ChatRepository = require('../infra/ChatRepository');
const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'ChatService' });

/**
 * Chat Service - Business logic for chat system
 */
class ChatService {
  constructor(chatRepository) {
    this.chatRepository = chatRepository || new ChatRepository();
  }

  /**
   * Send a message to a channel
   * @param {number} userId - User ID sending the message
   * @param {string} channelType - Type of channel (global, alliance, private, system)
   * @param {string} message - Message content
   * @param {number|null} channelId - Channel ID (alliance ID for alliance channels)
   * @param {Object} metadata - Optional metadata (attachments, mentions, etc.)
   * @returns {Promise<Object>} - Created message
   */
  async sendMessage(userId, channelType, message, channelId = null, metadata = {}) {
    try {
      // Validation
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > 2000) {
        throw new Error('Message too long (max 2000 characters)');
      }

      // Rate limiting: Check last message timestamp (simple implementation)
      // TODO: Implement Redis-based rate limiting for production
      
      // Profanity filter (basic implementation)
      const cleanMessage = this._filterProfanity(message);

      const messageData = {
        userId,
        channelType,
        channelId,
        message: cleanMessage,
        metadata,
      };

      const createdMessage = await this.chatRepository.createMessage(messageData);

      logger.info('Message sent', {
        messageId: createdMessage.id,
        userId,
        channelType,
        channelId,
      });

      return createdMessage;
    } catch (error) {
      logger.error('Error sending message', {
        error: error.message,
        userId,
        channelType,
        channelId,
      });
      throw error;
    }
  }

  /**
   * Get messages for a channel
   * @param {string} channelType - Type of channel
   * @param {number|null} channelId - Channel ID
   * @param {number} limit - Number of messages to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} - Messages and pagination info
   */
  async getMessages(channelType, channelId = null, limit = 50, offset = 0) {
    try {
      // Limit maximum messages per request
      const safeLimit = Math.min(limit, 100);

      const messages = await this.chatRepository.getChannelMessages(
        channelType,
        channelId,
        safeLimit,
        offset
      );

      const totalCount = await this.chatRepository.getMessageCount(channelType, channelId);

      return {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          limit: safeLimit,
          offset,
          total: totalCount,
          hasMore: offset + safeLimit < totalCount,
        },
      };
    } catch (error) {
      logger.error('Error getting messages', {
        error: error.message,
        channelType,
        channelId,
      });
      throw error;
    }
  }

  /**
   * Get recent messages after a timestamp (for real-time sync)
   * @param {string} channelType - Type of channel
   * @param {number|null} channelId - Channel ID
   * @param {Date} afterTimestamp - Fetch messages after this timestamp
   * @returns {Promise<Array>} - New messages
   */
  async getMessagesAfter(channelType, channelId = null, afterTimestamp) {
    try {
      return await this.chatRepository.getMessagesAfter(channelType, channelId, afterTimestamp);
    } catch (error) {
      logger.error('Error getting messages after timestamp', {
        error: error.message,
        channelType,
        channelId,
        afterTimestamp,
      });
      throw error;
    }
  }

  /**
   * Edit a message
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID (must be message author)
   * @param {string} newMessage - New message content
   * @returns {Promise<Object>} - Updated message
   */
  async editMessage(messageId, userId, newMessage) {
    try {
      const message = await this.chatRepository.getMessageById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.userId !== userId) {
        throw new Error('You can only edit your own messages');
      }

      if (!newMessage || newMessage.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (newMessage.length > 2000) {
        throw new Error('Message too long (max 2000 characters)');
      }

      const cleanMessage = this._filterProfanity(newMessage);

      const updatedMessage = await this.chatRepository.updateMessage(messageId, cleanMessage);

      logger.info('Message edited', { messageId, userId });

      return updatedMessage;
    } catch (error) {
      logger.error('Error editing message', {
        error: error.message,
        messageId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Delete a message
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID (must be message author or admin)
   * @param {boolean} isAdmin - Whether user is admin
   * @returns {Promise<boolean>}
   */
  async deleteMessage(messageId, userId, isAdmin = false) {
    try {
      const message = await this.chatRepository.getMessageById(messageId);

      if (!message) {
        throw new Error('Message not found');
      }

      if (!isAdmin && message.userId !== userId) {
        throw new Error('You can only delete your own messages');
      }

      const deleted = await this.chatRepository.deleteMessage(messageId);

      logger.info('Message deleted', { messageId, userId, isAdmin });

      return deleted;
    } catch (error) {
      logger.error('Error deleting message', {
        error: error.message,
        messageId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Send a system message
   * @param {string} message - System message content
   * @param {string} channelType - Channel type (global or alliance)
   * @param {number|null} channelId - Channel ID for alliance messages
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} - Created message
   */
  async sendSystemMessage(message, channelType = 'global', channelId = null, metadata = {}) {
    try {
      // Get or create system user (ID: 1)
      const { User } = require('../../../models');
      let systemUser = await User.findByPk(1);
      
      if (!systemUser) {
        // Create system user if doesn't exist
        systemUser = await User.create({
          id: 1,
          username: 'System',
          email: 'system@terradominus.com',
          password: 'SYSTEM_NO_LOGIN',
        });
      }

      const messageData = {
        userId: systemUser.id,
        channelType,
        channelId,
        message,
        metadata: {
          ...metadata,
          isSystem: true,
        },
      };

      const createdMessage = await this.chatRepository.createMessage(messageData);

      logger.info('System message sent', {
        messageId: createdMessage.id,
        channelType,
        channelId,
      });

      return createdMessage;
    } catch (error) {
      logger.error('Error sending system message', {
        error: error.message,
        channelType,
        channelId,
      });
      throw error;
    }
  }

  /**
   * Basic profanity filter
   * @param {string} message - Message to filter
   * @returns {string} - Filtered message
   * @private
   */
  _filterProfanity(message) {
    // TODO: Implement comprehensive profanity filter
    // For now, just a basic example
    const profanityList = ['badword1', 'badword2']; // Replace with actual list
    let filtered = message;

    profanityList.forEach((word) => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    });

    return filtered;
  }

  /**
   * Clean up old messages (called by scheduled job)
   * @param {number} daysOld - Delete messages older than this many days
   * @returns {Promise<number>} - Number of deleted messages
   */
  async cleanupOldMessages(daysOld = 30) {
    try {
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - daysOld);

      const deletedCount = await this.chatRepository.deleteOldMessages(beforeDate);

      logger.info('Old messages cleanup completed', { deletedCount, daysOld });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old messages', { error: error.message, daysOld });
      throw error;
    }
  }
}

module.exports = ChatService;
