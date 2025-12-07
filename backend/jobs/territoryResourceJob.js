const cron = require('node-cron');
const { getLogger } = require('../utils/logger');
const PlayerTerritory = require('../models/PlayerTerritory');
const UserResourceT2 = require('../models/UserResourceT2');
const sequelize = require('../db');

const logger = getLogger({ module: 'TerritoryResourceJob' });

/**
 * Job qui distribue les ressources générées par les territoires
 * S'exécute toutes les heures
 */
class TerritoryResourceJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Démarre le job (toutes les heures)
   */
  start() {
    // S'exécute toutes les heures à la minute 0
    cron.schedule('0 * * * *', async () => {
      await this.execute();
    });

    logger.info('Territory Resource Job started (runs every hour)');
  }

  /**
   * Exécute la distribution des ressources
   */
  async execute() {
    if (this.isRunning) {
      logger.warn('Territory Resource Job already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting territory resource distribution');

      // Récupérer tous les territoires actifs
      const territories = await PlayerTerritory.findAll({
        attributes: ['id', 'user_id', 'resource_bonus'],
      });

      if (territories.length === 0) {
        logger.info('No territories to process');
        return;
      }

      // Grouper par utilisateur
      const userBonuses = {};
      territories.forEach((territory) => {
        if (!userBonuses[territory.user_id]) {
          userBonuses[territory.user_id] = {};
        }

        // Additionner les bonus de chaque territoire
        Object.keys(territory.resource_bonus).forEach((resourceType) => {
          if (!userBonuses[territory.user_id][resourceType]) {
            userBonuses[territory.user_id][resourceType] = 0;
          }
          userBonuses[territory.user_id][resourceType] += territory.resource_bonus[resourceType];
        });
      });

      // Appliquer les bonus à chaque utilisateur
      const updates = [];
      for (const [userId, bonuses] of Object.entries(userBonuses)) {
        for (const [resourceType, amount] of Object.entries(bonuses)) {
          updates.push(
            UserResourceT2.increment('amount', {
              by: amount,
              where: {
                user_id: parseInt(userId),
                resource_type: resourceType,
              },
            })
          );
        }
      }

      await Promise.all(updates);

      const duration = Date.now() - startTime;
      logger.info(
        {
          territoriesProcessed: territories.length,
          usersAffected: Object.keys(userBonuses).length,
          durationMs: duration,
        },
        'Territory resource distribution completed'
      );
    } catch (error) {
      logger.error({ err: error }, 'Error in territory resource job');
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Exécute manuellement le job (pour tests)
   */
  async executeNow() {
    logger.info('Manual execution of territory resource job');
    await this.execute();
  }
}

module.exports = new TerritoryResourceJob();
