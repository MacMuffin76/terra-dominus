const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

module.exports = ({ chatController }) => {
  /**
   * GET /api/v1/chat/messages
   * Get messages for a channel (global or alliance)
   */
  router.get('/messages', protect, chatController.getMessages);

  /**
   * POST /api/v1/chat/messages
   * Send a message (HTTP fallback, prefer Socket.IO)
   */
  router.post('/messages', protect, chatController.sendMessage);

  /**
   * PUT /api/v1/chat/messages/:messageId
   * Edit a message
   */
  router.put('/messages/:messageId', protect, chatController.editMessage);

  /**
   * DELETE /api/v1/chat/messages/:messageId
   * Delete a message
   */
  router.delete('/messages/:messageId', protect, chatController.deleteMessage);

  return router;
};
