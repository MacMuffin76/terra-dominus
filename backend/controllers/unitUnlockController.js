// backend/controllers/unitUnlockController.js

const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'unit-unlock-controller' });

module.exports = ({ unitUnlockService }) => {
  /**
   * GET /api/v1/units/unlock/available
   * Get available and locked units for current user
   */
  const getAvailableUnits = async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info(`Getting available units for user ${userId}`);

        const unitsData = await unitUnlockService.getAvailableUnits(userId);

      res.json(unitsData);
    } catch (error) {
      logger.error('Error getting available units:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des unités disponibles',
        error: error.message 
      });
    }
  };

  /**
   * GET /api/v1/units/unlock/check/:unitId
   * Check if specific unit is unlocked for current user
   */
  const checkUnitUnlock = async (req, res) => {
    try {
        const userId = req.user.id;
        const unitId = req.params.unitId;

        logger.info(`Checking unlock status for unit ${unitId}, user ${userId}`);

        const unlockData = await unitUnlockService.checkUnitUnlock(userId, unitId);

      res.json(unlockData);
    } catch (error) {
      logger.error('Error checking unit unlock:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la vérification du débloquage',
        error: error.message 
      });
    }
  };

  /**
   * GET /api/v1/units/unlock/tiers
   * Get tiers summary with unlock status for current user
   */
  const getTiersSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info(`Getting tiers summary for user ${userId}`);

        const tiersSummary = await unitUnlockService.getTiersSummary(userId);

      res.json(tiersSummary);
    } catch (error) {
      logger.error('Error getting tiers summary:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération du résumé des tiers',
        error: error.message 
      });
    }
  };

  return {
    getAvailableUnits,
    checkUnitUnlock,
    getTiersSummary
  };
};
