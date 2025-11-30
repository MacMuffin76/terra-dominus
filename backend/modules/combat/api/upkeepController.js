const { runWithContext } = require('../../../utils/logger');

/**
 * Contrôleur pour l'upkeep des unités
 */
module.exports = ({ upkeepService }) => {
  /**
   * GET /api/v1/upkeep/report
   * Obtenir le rapport d'upkeep du joueur
   */
  const getUpkeepReport = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        
        const report = await upkeepService.getUpkeepReport(userId);
        
        res.json({
          success: true,
          data: report
        });
      } catch (error) {
        console.error('Error getting upkeep report:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get upkeep report'
        });
      }
    });
  };

  /**
   * GET /api/v1/upkeep/city/:cityId
   * Obtenir l'upkeep détaillé d'une ville
   */
  const getCityUpkeep = async (req, res) => {
    return runWithContext(async () => {
      try {
        const { cityId } = req.params;
        
        const upkeep = await upkeepService.calculateCityUpkeep(parseInt(cityId));
        
        res.json({
          success: true,
          data: upkeep
        });
      } catch (error) {
        console.error('Error getting city upkeep:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get city upkeep'
        });
      }
    });
  };

  /**
   * POST /api/v1/upkeep/process (Admin only)
   * Déclencher manuellement le traitement de l'upkeep
   */
  const processUpkeep = async (req, res) => {
    return runWithContext(async () => {
      try {
        const result = await upkeepService.processHourlyUpkeep();
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Error processing upkeep:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to process upkeep'
        });
      }
    });
  };

  return {
    getUpkeepReport,
    getCityUpkeep,
    processUpkeep
  };
};
