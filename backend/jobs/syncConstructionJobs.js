/**
 * Synchronisation des jobs de construction au démarrage du serveur
 * Reprogramme automatiquement les constructions in_progress qui n'ont pas de job BullMQ
 */

const ConstructionQueue = require('../models/ConstructionQueue');
const City = require('../models/City');
const { Op } = require('sequelize');
const { scheduleConstructionCompletion } = require('./constructionQueue');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'construction-sync' });

/**
 * Synchronise tous les jobs de construction actifs
 * - Marque comme completed les constructions expirées
 * - Reprogramme les jobs BullMQ pour les constructions en cours
 */
async function syncConstructionJobs() {
  logger.info('Starting construction jobs synchronization...');

  try {
    const now = new Date();

    // 1. Trouver toutes les constructions in_progress
    const activeConstructions = await ConstructionQueue.findAll({
      where: {
        status: 'in_progress',
      },
      order: [['cityId', 'ASC'], ['finishTime', 'ASC']],
    });

    if (activeConstructions.length === 0) {
      logger.info('No active constructions to sync');
      return { synced: 0, expired: 0 };
    }

    logger.info({ count: activeConstructions.length }, 'Found active constructions');

    let expiredCount = 0;
    let syncedCount = 0;

    for (const construction of activeConstructions) {
      try {
        const finishTime = new Date(construction.finishTime);

        // Si la construction est déjà terminée, la marquer comme completed
        if (finishTime <= now) {
          await construction.update({ status: 'completed' });
          logger.info(
            { 
              constructionId: construction.id, 
              cityId: construction.cityId,
              delayMs: now - finishTime 
            },
            'Marked expired construction as completed'
          );
          expiredCount++;
        } else {
          // Sinon, reprogrammer le job BullMQ
          const city = await City.findByPk(construction.cityId);
          const userId = city?.user_id;

          if (!userId) {
            logger.warn(
              { constructionId: construction.id, cityId: construction.cityId },
              'Cannot sync construction: user not found'
            );
            continue;
          }

          await scheduleConstructionCompletion(construction, { userId });
          
          const remainingSeconds = Math.ceil((finishTime - now) / 1000);
          logger.info(
            { 
              constructionId: construction.id, 
              cityId: construction.cityId,
              userId,
              remainingSeconds 
            },
            'Rescheduled construction job'
          );
          syncedCount++;
        }
      } catch (err) {
        logger.error(
          { err, constructionId: construction.id },
          'Error syncing construction'
        );
      }
    }

    logger.info(
      { synced: syncedCount, expired: expiredCount },
      'Construction jobs synchronization completed'
    );

    return { synced: syncedCount, expired: expiredCount };
  } catch (err) {
    logger.error({ err }, 'Error during construction jobs synchronization');
    throw err;
  }
}

module.exports = { syncConstructionJobs };
