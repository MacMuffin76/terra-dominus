const { runWithContext } = require('../../../utils/logger');

/**
 * Contrôleur pour les unlocks d'unités
 */
module.exports = ({ unitUnlockService }) => {
  /**
   * GET /api/v1/units/available
   * Obtenir les unités disponibles (débloquées et verrouillées)
   */
  const getAvailableUnits = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        
        const result = await unitUnlockService.getAvailableUnits(userId);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Error getting available units:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get available units'
        });
      }
    });
  };

  /**
   * GET /api/v1/units/check/:unitId
   * Vérifier si une unité spécifique est débloquée
   */
  const checkUnitUnlock = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const { unitId } = req.params;
        
        const result = await unitUnlockService.checkUnitUnlock(userId, unitId);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Error checking unit unlock:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to check unit unlock'
        });
      }
    });
  };

  /**
   * GET /api/v1/units/tiers
   * Obtenir le résumé de tous les tiers
   */
  const getTiersSummary = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const { User } = require('../../../models');
        
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const tiers = unitUnlockService.getTiersSummary(user.level || 1);
        
        res.json({
          success: true,
          data: {
            userLevel: user.level || 1,
            tiers
          }
        });
      } catch (error) {
        console.error('Error getting tiers summary:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get tiers summary'
        });
      }
    });
  };

  return {
    getAvailableUnits,
    checkUnitUnlock,
    getTiersSummary
  };
};
