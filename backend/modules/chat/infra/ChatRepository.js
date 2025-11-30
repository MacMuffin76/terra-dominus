const { ChatMessage } = require('../../../models');
const { getLogger } = require('../../../utils/logger');
const { Op } = require('sequelize');

const logger = getLogger({ module: 'ChatRepository' });

/**
 * Chat Repository - Data access layer for chat messages
 */
class ChatRepository {
  /**
   * Create a new chat message
   * @param {Object} messageData - Message data
   * @returns {Promise<ChatMessage>}
   */
  async createMessage(messageData) {
    try {
      return await ChatMessage.create(messageData);
    } catch (error) {
      logger.error('Error creating chat message', { error: error.message, messageData });
      throw error;
    }
  }

  /**
   * Get messages for a channel with pagination
   * @param {string} channelType - Type of channel (global, alliance, private, system)
   * @param {number|null} channelId - Channel ID (alliance ID for alliance channels)
   * @param {number} limit - Number of messages to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array<ChatMessage>>}
   */
  async getChannelMessages(channelType, channelId = null, limit = 50, offset = 0) {
    try {
      const where = {
        channelType,
        isDeleted: false,
      };

      if (channelType === 'alliance' && channelId) {
        where.channelId = channelId;
      }

      return await ChatMessage.findAll({
        where,
        include: [
          {
            association: 'author',
            attributes: ['id', 'username'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
    } catch (error) {
      logger.error('Error fetching channel messages', {
        error: error.message,
        channelType,
        channelId,
      });
      throw error;
    }
  }

  /**
   * Get messages after a specific timestamp (for real-time updates)
   * @param {string} channelType - Type of channel
   * @param {number|null} channelId - Channel ID
   * @param {Date} afterTimestamp - Fetch messages after this timestamp
   * @returns {Promise<Array<ChatMessage>>}
   */
  async getMessagesAfter(channelType, channelId = null, afterTimestamp) {
    try {
      const where = {
        channelType,
        isDeleted: false,
        createdAt: {
          [Op.gt]: afterTimestamp,
        },
      };

      if (channelType === 'alliance' && channelId) {
        where.channelId = channelId;
      }

      return await ChatMessage.findAll({
        where,
        include: [
          {
            association: 'author',
            attributes: ['id', 'username'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });
    } catch (error) {
      logger.error('Error fetching messages after timestamp', {
        error: error.message,
        channelType,
        channelId,
        afterTimestamp,
      });
      throw error;
    }
  }

  /**
   * Get a single message by ID
   * @param {number} messageId - Message ID
   * @returns {Promise<ChatMessage|null>}
   */
  async getMessageById(messageId) {
    try {
      return await ChatMessage.findByPk(messageId, {
        include: [
          {
            association: 'author',
            attributes: ['id', 'username'],
          },
        ],
      });
    } catch (error) {
      logger.error('Error fetching message by ID', { error: error.message, messageId });
      throw error;
    }
  }

  /**
   * Update a message (for edits)
   * @param {number} messageId - Message ID
   * @param {string} newMessage - New message content
   * @returns {Promise<ChatMessage|null>}
   */
  async updateMessage(messageId, newMessage) {
    try {
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        return null;
      }

      message.message = newMessage;
      message.editedAt = new Date();
      await message.save();

      return message;
    } catch (error) {
      logger.error('Error updating message', { error: error.message, messageId });
      throw error;
    }
  }

  /**
   * Soft delete a message
   * @param {number} messageId - Message ID
   * @returns {Promise<boolean>}
   */
  async deleteMessage(messageId) {
    try {
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        return false;
      }

      message.isDeleted = true;
      await message.save();

      return true;
    } catch (error) {
      logger.error('Error deleting message', { error: error.message, messageId });
      throw error;
    }
  }

  /**
   * Get message count for a channel
   * @param {string} channelType - Type of channel
   * @param {number|null} channelId - Channel ID
   * @returns {Promise<number>}
   */
  async getMessageCount(channelType, channelId = null) {
    try {
      const where = {
        channelType,
        isDeleted: false,
      };

      if (channelType === 'alliance' && channelId) {
        where.channelId = channelId;
      }

      return await ChatMessage.count({ where });
    } catch (error) {
      logger.error('Error counting messages', { error: error.message, channelType, channelId });
      throw error;
    }
  }

  /**
   * Delete old messages (cleanup job)
   * @param {Date} beforeDate - Delete messages before this date
   * @returns {Promise<number>} - Number of deleted messages
   */
  async deleteOldMessages(beforeDate) {
    try {
      const result = await ChatMessage.destroy({
        where: {
          createdAt: {
            [Op.lt]: beforeDate,
          },
        },
      });

      logger.info('Old messages deleted', { count: result, beforeDate });
      return result;
    } catch (error) {
      logger.error('Error deleting old messages', { error: error.message, beforeDate });
      throw error;
    }
  }
}

module.exports = ChatRepository;
