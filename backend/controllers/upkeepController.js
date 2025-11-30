// backend/controllers/upkeepController.js

const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'upkeep-controller' });

module.exports = ({ upkeepService }) => {
  /**
   * GET /api/v1/upkeep/report
   * Get upkeep report for current user (all cities)
   */
  const getUpkeepReport = async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info(`Getting upkeep report for user ${userId}`);

        const report = await upkeepService.getUpkeepReport(userId);

      res.json(report);
    } catch (error) {
      logger.error('Error getting upkeep report:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération du rapport d\'entretien',
        error: error.message 
      });
    }
  };

  /**
   * GET /api/v1/upkeep/city/:cityId
   * Get upkeep for specific city
   */
  const getCityUpkeep = async (req, res) => {
    try {
        const userId = req.user.id;
        const cityId = parseInt(req.params.cityId);

        logger.info(`Getting upkeep for city ${cityId}`);

        const upkeep = await upkeepService.calculateCityUpkeep(cityId, userId);

        if (!upkeep) {
          return res.status(404).json({ message: 'Ville non trouvée ou non accessible' });
        }

      res.json(upkeep);
    } catch (error) {
      logger.error('Error getting city upkeep:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de l\'entretien de la ville',
        error: error.message 
      });
    }
  };

  /**
   * POST /api/v1/upkeep/process (Admin only)
   * Manually trigger upkeep processing
   */
  const processUpkeep = async (req, res) => {
    try {
        logger.info('Manual upkeep processing triggered by admin');

        const results = await upkeepService.processHourlyUpkeep();

      res.json({ 
        message: 'Traitement de l\'entretien terminé',
        results 
      });
    } catch (error) {
      logger.error('Error processing upkeep:', error);
      res.status(500).json({ 
        message: 'Erreur lors du traitement de l\'entretien',
        error: error.message 
      });
    }
  };

  return {
    getUpkeepReport,
    getCityUpkeep,
    processUpkeep
  };
};
