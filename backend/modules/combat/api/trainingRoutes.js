const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const unitTrainingService = container.resolve('unitTrainingService');
  const { protect } = require('../../../middleware/authMiddleware');
  const { strictLimiter, moderateLimiter } = require('../../../middleware/rateLimiters');

  /**
   * POST /api/v1/units/train
   * Train units (recruit new soldiers)
   */
  router.post('/train', strictLimiter, protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const { unitId, quantity } = req.body;

      // Validation
      if (!unitId || !quantity) {
        return res.status(400).json({ 
          success: false, 
          message: 'unitId et quantity sont requis' 
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'La quantité doit être un entier positif' 
        });
      }

      // Get unit definition from unitDefinitions
      const unitDefinitions = require('../domain/unitDefinitions');
      const unitDefinition = unitDefinitions.find(u => u.id === unitId);

      if (!unitDefinition) {
        return res.status(404).json({ 
          success: false, 
          message: 'Unité non trouvée' 
        });
      }

      // Train units
      const result = await unitTrainingService.trainUnits(
        userId,
        unitId,
        quantity,
        unitDefinition
      );

      res.json({
        success: true,
        message: result.message,
        remainingResources: result.remainingResources
      });

    } catch (error) {
      console.error('[TrainingRoutes] Error training units:', error);
      
      if (error.message.includes('Ressources insuffisantes')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }

      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'entraînement des unités' 
      });
    }
  });

  /**
   * GET /api/v1/units/player
   * Get all trained units for the current player
   */
  router.get('/player', moderateLimiter, protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const units = await unitTrainingService.getPlayerUnits(userId);

      res.json({
        success: true,
        units
      });

    } catch (error) {
      console.error('[TrainingRoutes] Error fetching player units:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des unités' 
      });
    }
  });

  return router;
};
