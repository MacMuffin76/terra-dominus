const { runWithContext } = require('../utils/logger');
const { getIO } = require('../socket');

/**
 * Service de gestion des messages utilisateur (boîte aux lettres)
 */
class MessageService {
  constructor({ sequelize }) {
    this.sequelize = sequelize;
    // Charger le modèle via models/index.js pour s'assurer qu'il est initialisé
    const { UserMessage } = require('../models');
    this.UserMessage = UserMessage;
  }

  /**
   * Créer un nouveau message pour un utilisateur
   */
  async createMessage({ userId, type, title, content, data = null, priority = 'normal', expiresAt = null }) {
    return runWithContext(async () => {
      const message = await this.UserMessage.create({
        user_id: userId,
        type,
        title,
        content,
        data,
        priority,
        expires_at: expiresAt
      });

      // Notifier en temps réel via socket
      this._notifyNewMessage(userId, message);

      return message;
    });
  }

  /**
   * Créer des messages pour plusieurs utilisateurs
   */
  async createBulkMessages(messages) {
    return runWithContext(async () => {
      const created = await this.UserMessage.bulkCreate(messages);
      
      // Notifier chaque utilisateur
      created.forEach(msg => {
        this._notifyNewMessage(msg.user_id, msg);
      });

      return created;
    });
  }

  /**
   * Récupérer les messages d'un utilisateur
   */
  async getUserMessages(userId, filters = {}) {
    return runWithContext(async () => {
      const {
        type,
        isRead,
        priority,
        limit = 50,
        offset = 0,
        includeExpired = false
      } = filters;

      const where = { user_id: userId };

      if (type) {
        where.type = type;
      }

      if (typeof isRead === 'boolean') {
        where.is_read = isRead;
      }

      if (priority) {
        where.priority = priority;
      }

      if (!includeExpired) {
        where[this.sequelize.Sequelize.Op.or] = [
          { expires_at: null },
          { expires_at: { [this.sequelize.Sequelize.Op.gt]: new Date() } }
        ];
      }

      return this.UserMessage.findAll({
        where,
        order: [
          ['priority', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit,
        offset
      });
    });
  }

  /**
   * Compter les messages non lus
   */
  async getUnreadCount(userId, type = null) {
    return runWithContext(async () => {
      const where = {
        user_id: userId,
        is_read: false,
        [this.sequelize.Sequelize.Op.or]: [
          { expires_at: null },
          { expires_at: { [this.sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      };

      if (type) {
        where.type = type;
      }

      return this.UserMessage.count({ where });
    });
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(messageId, userId) {
    return runWithContext(async () => {
      const [updated] = await this.UserMessage.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            id: messageId,
            user_id: userId
          }
        }
      );

      return updated > 0;
    });
  }

  /**
   * Marquer tous les messages comme lus
   */
  async markAllAsRead(userId, type = null) {
    return runWithContext(async () => {
      const where = {
        user_id: userId,
        is_read: false
      };

      if (type) {
        where.type = type;
      }

      const [updated] = await this.UserMessage.update(
        {
          is_read: true,
          read_at: new Date()
        },
        { where }
      );

      return updated;
    });
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId, userId) {
    return runWithContext(async () => {
      const deleted = await this.UserMessage.destroy({
        where: {
          id: messageId,
          user_id: userId
        }
      });

      return deleted > 0;
    });
  }

  /**
   * Supprimer tous les messages lus
   */
  async deleteReadMessages(userId) {
    return runWithContext(async () => {
      return this.UserMessage.destroy({
        where: {
          user_id: userId,
          is_read: true
        }
      });
    });
  }

  /**
   * Supprimer les messages expirés
   */
  async deleteExpiredMessages() {
    return runWithContext(async () => {
      return this.UserMessage.destroy({
        where: {
          expires_at: {
            [this.sequelize.Sequelize.Op.lte]: new Date()
          }
        }
      });
    });
  }

  /**
   * Messages spécifiques pour le combat
   */
  async createAttackLaunchedMessage(userId, attackData) {
    return this.createMessage({
      userId,
      type: 'attack_launched',
      title: '⚔️ Attaque lancée',
      content: `Votre attaque contre ${attackData.defenderCityName} est en route. Arrivée prévue: ${new Date(attackData.arrivalTime).toLocaleString('fr-FR')}`,
      data: attackData,
      priority: 'normal'
    });
  }

  async createAttackIncomingMessage(userId, attackData) {
    return this.createMessage({
      userId,
      type: 'attack_incoming',
      title: '🚨 Attaque imminente !',
      content: `Votre ville ${attackData.defenderCityName} est attaquée par ${attackData.attackerUsername} ! Arrivée: ${new Date(attackData.arrivalTime).toLocaleString('fr-FR')}`,
      data: attackData,
      priority: 'urgent'
    });
  }

  async createAttackResultMessage(userId, combatResult) {
    const { outcome, loot, defenderCityName, attackerCityName } = combatResult;
    
    const isVictory = outcome === 'attacker_victory' || outcome === 'defender_victory';
    const title = isVictory ? '🏆 Victoire !' : (outcome === 'draw' ? '⚔️ Combat indécis' : '💀 Défaite');
    
    let content;
    if (outcome === 'attacker_victory') {
      content = `Vous avez remporté la bataille et pillé ${loot.gold} or, ${loot.metal} métal, ${loot.fuel} carburant de ${defenderCityName}`;
    } else if (outcome === 'defender_victory') {
      content = `Vous avez repoussé l'attaque sur ${defenderCityName} !`;
    } else {
      content = `Combat indécis. Les deux camps ont subi de lourdes pertes.`;
    }

    return this.createMessage({
      userId,
      type: 'attack_result',
      title,
      content,
      data: combatResult,
      priority: 'high'
    });
  }

  async createSpyReportMessage(userId, spyData) {
    return this.createMessage({
      userId,
      type: 'spy_report',
      title: '🕵️ Rapport d\'espionnage',
      content: `Mission d'espionnage sur ${spyData.targetCityName} terminée. Taux de réussite: ${spyData.successRate}%`,
      data: spyData,
      priority: 'normal',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    });
  }

  async createSpyDetectedMessage(userId, spyData) {
    return this.createMessage({
      userId,
      type: 'spy_detected',
      title: '🚨 Espion détecté !',
      content: `Un espion de ${spyData.spyUsername} a été repéré dans votre ville ${spyData.targetCityName}`,
      data: spyData,
      priority: 'high'
    });
  }

  async createAdminMessage(userId, title, content, priority = 'high') {
    return this.createMessage({
      userId,
      type: 'admin_message',
      title: `📢 ${title}`,
      content,
      priority
    });
  }

  /**
   * Notifier via socket en temps réel
   * @private
   */
  _notifyNewMessage(userId, message) {
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('new_message', {
          id: message.id,
          type: message.type,
          title: message.title,
          content: message.content,
          priority: message.priority,
          created_at: message.created_at
        });
      }
    } catch (error) {
      console.error('Error notifying new message:', error);
    }
  }
}

module.exports = MessageService;
