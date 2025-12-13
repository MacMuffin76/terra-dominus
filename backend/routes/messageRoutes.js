const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

/**
 * Routes pour la boîte aux lettres / messages utilisateur
 */
module.exports = (container) => {
  const messageService = container.resolve('messageService');

  /**
   * @route   GET /api/v1/messages
   * @desc    Récupérer les messages de l'utilisateur
   * @access  Private
   */
  router.get('/', protect, async (req, res) => {
    try {
      const {
        type,
        isRead,
        priority,
        limit = 50,
        offset = 0,
        includeExpired = false
      } = req.query;

      const messages = await messageService.getUserMessages(req.user.id, {
        type,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        priority,
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeExpired: includeExpired === 'true'
      });

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
  });

  /**
   * @route   GET /api/v1/messages/unread-count
   * @desc    Compter les messages non lus
   * @access  Private
   */
  router.get('/unread-count', protect, async (req, res) => {
    try {
      const { type } = req.query;
      const count = await messageService.getUnreadCount(req.user.id, type);
      
      res.json({ count });
    } catch (error) {
      console.error('Error counting unread messages:', error);
      res.status(500).json({ message: 'Erreur lors du comptage des messages' });
    }
  });

  /**
   * @route   PUT /api/v1/messages/:id/read
   * @desc    Marquer un message comme lu
   * @access  Private
   */
  router.put('/:id/read', protect, async (req, res) => {
    try {
      const success = await messageService.markAsRead(parseInt(req.params.id), req.user.id);
      
      if (!success) {
        return res.status(404).json({ message: 'Message introuvable' });
      }

      res.json({ message: 'Message marqué comme lu' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour du message' });
    }
  });

  /**
   * @route   PUT /api/v1/messages/read-all
   * @desc    Marquer tous les messages comme lus
   * @access  Private
   */
  router.put('/read-all', protect, async (req, res) => {
    try {
      const { type } = req.body;
      const updated = await messageService.markAllAsRead(req.user.id, type);
      
      res.json({ message: `${updated} message(s) marqué(s) comme lu(s)` });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour des messages' });
    }
  });

  /**
   * @route   DELETE /api/v1/messages/:id
   * @desc    Supprimer un message
   * @access  Private
   */
  router.delete('/:id', protect, async (req, res) => {
    try {
      const success = await messageService.deleteMessage(parseInt(req.params.id), req.user.id);
      
      if (!success) {
        return res.status(404).json({ message: 'Message introuvable' });
      }

      res.json({ message: 'Message supprimé' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression du message' });
    }
  });

  /**
   * @route   DELETE /api/v1/messages/read
   * @desc    Supprimer tous les messages lus
   * @access  Private
   */
  router.delete('/read/all', protect, async (req, res) => {
    try {
      const deleted = await messageService.deleteReadMessages(req.user.id);
      
      res.json({ message: `${deleted} message(s) supprimé(s)` });
    } catch (error) {
      console.error('Error deleting read messages:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression des messages' });
    }
  });

  return router;
};
