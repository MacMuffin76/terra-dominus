const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'ProductionRoutes' });

const createProductionRoutes = ({ productionCalculatorService }) => {
  const router = express.Router();

  /**
   * GET /api/v1/production/rates
   * Obtenir les taux de production actuels par seconde
   */
  router.get('/rates', protect, async (req, res) => {
    try {
      const userId = req.user.id;
      
      const rates = await productionCalculatorService.calculateProductionRates(userId);
      
      // Log pour déboguer
      console.log(`📊 Production rates for user ${userId}:`, {
        gold: rates.production.gold.toFixed(4) + '/s',
        metal: rates.production.metal.toFixed(4) + '/s',
        fuel: rates.production.fuel.toFixed(4) + '/s',
        energy: rates.production.energy.toFixed(4) + '/s',
      });
      
      res.json({
        success: true,
        data: rates,
      });
      
      (req.logger || logger).info({ userId }, 'Production rates retrieved');
    } catch (error) {
      (req.logger || logger).error({ err: error, userId: req.user?.id }, 'Failed to get production rates');
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération des taux de production' 
      });
    }
  });

  return router;
};

module.exports = createProductionRoutes;
