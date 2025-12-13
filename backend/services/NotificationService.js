const { getIO } = require('../socket');
const { logger } = require('../utils/logger');

/**
 * NotificationService - Service de notifications temps réel via Socket.IO
 * Envoie aussi les notifications persistantes via MessageService
 */
class NotificationService {
  static _messageService = null;

  /**
   * Initialiser le MessageService (appelé par le container après initialisation)
   */
  static setMessageService(messageService) {
    this._messageService = messageService;
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  static sendToUser(userId, eventName, data) {
    try {
      const io = getIO();
      if (!io) {
        logger.warn('[NotificationService] Socket.IO non initialisé');
        return;
      }

      io.to(`user_${userId}`).emit(eventName, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.info(`[NotificationService] Notification envoyée à user ${userId}`, { eventName });
    } catch (error) {
      logger.error('[NotificationService] Erreur envoi notification', { error: error.message, userId, eventName });
    }
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs
   */
  static sendToUsers(userIds, eventName, data) {
    userIds.forEach(userId => {
      this.sendToUser(userId, eventName, data);
    });
  }

  /**
   * Notifications spécifiques au combat
   */
  static async notifyAttackLaunched(attackerUserId, defenderUserId, attackData) {
    this.sendToUser(attackerUserId, 'attack_launched', {
      type: 'attack',
      subtype: 'launched',
      message: `Votre attaque contre ${attackData.defenderCityName} est en route`,
      data: attackData
    });

    this.sendToUser(defenderUserId, 'attack_incoming', {
      type: 'attack',
      subtype: 'incoming',
      message: `Votre ville ${attackData.defenderCityName} est attaquée !`,
      data: attackData,
      priority: 'high'
    });

    // Enregistrer dans la boîte aux lettres
    if (this._messageService) {
      try {
        await Promise.all([
          this._messageService.createAttackLaunchedMessage(attackerUserId, attackData),
          this._messageService.createAttackIncomingMessage(defenderUserId, attackData)
        ]);
      } catch (error) {
        logger.error('Erreur création messages attaque', { error });
      }
    }
  }

  static async notifyAttackArrived(attackerUserId, defenderUserId, combatResult) {
    const { outcome, attackId, attackerCityName, defenderCityName, loot } = combatResult;

    if (outcome === 'attacker_victory') {
      this.sendToUser(attackerUserId, 'attack_victory', {
        type: 'combat',
        subtype: 'victory',
        message: `Victoire ! Vous avez pillé ${loot.gold} or, ${loot.metal} métal, ${loot.fuel} carburant`,
        data: combatResult
      });

      this.sendToUser(defenderUserId, 'attack_defeat', {
        type: 'combat',
        subtype: 'defeat',
        message: `Défaite ! Votre ville ${defenderCityName} a été pillée`,
        data: combatResult,
        priority: 'high'
      });

      // Messages persistants
      if (this._messageService) {
        try {
          await Promise.all([
            this._messageService.createAttackResultMessage(attackerUserId, combatResult),
            this._messageService.createAttackResultMessage(defenderUserId, combatResult)
          ]);
        } catch (error) {
          logger.error('Erreur création messages résultat combat', { error });
        }
      }
    } else if (outcome === 'defender_victory') {
      this.sendToUser(attackerUserId, 'attack_defeat', {
        type: 'combat',
        subtype: 'defeat',
        message: `Défaite ! Votre attaque contre ${defenderCityName} a échoué`,
        data: combatResult
      });

      this.sendToUser(defenderUserId, 'attack_victory', {
        type: 'combat',
        subtype: 'victory',
        message: `Victoire ! Vous avez repoussé l'attaque sur ${defenderCityName}`,
        data: combatResult
      });

      // Messages persistants
      if (this._messageService) {
        try {
          await Promise.all([
            this._messageService.createAttackResultMessage(attackerUserId, combatResult),
            this._messageService.createAttackResultMessage(defenderUserId, combatResult)
          ]);
        } catch (error) {
          logger.error('Erreur création messages résultat combat', { error });
        }
      }
    } else {
      // Draw
      this.sendToUsers([attackerUserId, defenderUserId], 'attack_draw', {
        type: 'combat',
        subtype: 'draw',
        message: 'Combat indécis ! Les deux camps ont subi de lourdes pertes',
        data: combatResult
      });

      // Messages persistants
      if (this._messageService) {
        try {
          await Promise.all([
            this._messageService.createAttackResultMessage(attackerUserId, combatResult),
            this._messageService.createAttackResultMessage(defenderUserId, combatResult)
          ]);
        } catch (error) {
          logger.error('Erreur création messages résultat combat', { error });
        }
      }
    }
  }

  /**
   * Notifications espionnage
   */
  static notifySpyMissionLaunched(spyUserId, missionData) {
    this.sendToUser(spyUserId, 'spy_mission_launched', {
      type: 'espionage',
      subtype: 'launched',
      message: `Mission d'espionnage vers ${missionData.targetCityName} lancée`,
      data: missionData
    });
  }

  static notifySpyMissionCompleted(spyUserId, missionResult) {
    const { success, detected, intelData } = missionResult;

    if (success) {
      this.sendToUser(spyUserId, 'spy_mission_success', {
        type: 'espionage',
        subtype: 'success',
        message: detected ? 'Mission réussie mais détectée !' : 'Mission réussie !',
        data: missionResult
      });
    } else {
      this.sendToUser(spyUserId, 'spy_mission_failed', {
        type: 'espionage',
        subtype: 'failed',
        message: 'Mission d\'espionnage échouée',
        data: missionResult
      });
    }
  }

  static notifySpyMissionDetected(targetUserId, detectionData) {
    this.sendToUser(targetUserId, 'spy_detected', {
      type: 'espionage',
      subtype: 'detected',
      message: `Des espions ont été repérés dans ${detectionData.cityName} !`,
      data: detectionData,
      priority: 'high'
    });
  }

  /**
   * Notifications commerce
   */
  static notifyConvoySent(userId, convoyData) {
    this.sendToUser(userId, 'convoy_sent', {
      type: 'trade',
      subtype: 'sent',
      message: `Convoi commercial envoyé vers ${convoyData.destinationCityName}`,
      data: convoyData
    });
  }

  static notifyConvoyArrived(userId, convoyData) {
    this.sendToUser(userId, 'convoy_arrived', {
      type: 'trade',
      subtype: 'arrived',
      message: `Convoi arrivé à ${convoyData.destinationCityName} ! (+${convoyData.cargo.gold} or, +${convoyData.cargo.metal} métal, +${convoyData.cargo.fuel} carburant)`,
      data: convoyData
    });
  }

  static notifyConvoyIntercepted(userId, interceptionData) {
    this.sendToUser(userId, 'convoy_intercepted', {
      type: 'trade',
      subtype: 'intercepted',
      message: `Votre convoi a été intercepté ! Pertes: ${interceptionData.lostCargo.gold} or, ${interceptionData.lostCargo.metal} métal`,
      data: interceptionData,
      priority: 'high'
    });
  }

  /**
   * Notifications colonisation
   */
  static notifyColonizationStarted(userId, missionData) {
    this.sendToUser(userId, 'colonization_started', {
      type: 'colonization',
      subtype: 'started',
      message: `Colonisation vers (${missionData.targetX}, ${missionData.targetY}) lancée`,
      data: missionData
    });
  }

  static notifyColonizationCompleted(userId, newCityData) {
    this.sendToUser(userId, 'colonization_completed', {
      type: 'colonization',
      subtype: 'completed',
      message: `Nouvelle ville fondée : ${newCityData.cityName} !`,
      data: newCityData
    });
  }

  /**
   * Notification générique
   */
  static notify(userId, message, type = 'info', data = {}) {
    this.sendToUser(userId, 'notification', {
      type,
      message,
      data
    });
  }
}

module.exports = NotificationService;
