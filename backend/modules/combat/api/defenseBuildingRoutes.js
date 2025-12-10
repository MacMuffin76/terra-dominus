const express = require('express');

module.exports = (container) => {
  const router = express.Router();
  const defenseBuildingService = container.resolve('defenseBuildingService');
  const { protect } = require('../../../middleware/authMiddleware');
  const { strictLimiter, moderateLimiter } = require('../../../middleware/rateLimiters');

  /**
   * POST /api/v1/defenses/build
   * Construire des défenses
   */
  router.post('/build', strictLimiter, protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const { defenseId, quantity } = req.body;

      // Validation
      if (!defenseId || !quantity) {
        return res.status(400).json({ 
          success: false, 
          message: 'defenseId et quantity sont requis' 
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'La quantité doit être un entier positif' 
        });
      }

      // Get defense definition from defenseDefinitions
      const { DEFENSE_DEFINITIONS } = require('../domain/defenseDefinitions');
      const defenseDefinition = Object.values(DEFENSE_DEFINITIONS).find(d => d.id === defenseId);

      if (!defenseDefinition) {
        return res.status(404).json({ 
          success: false, 
          message: 'Défense non trouvée' 
        });
      }

      // Build defense
      const result = await defenseBuildingService.buildDefense(
        userId,
        defenseId,
        quantity,
        defenseDefinition
      );

      res.json({
        success: true,
        message: result.message,
        defense: result.defense,
        remainingResources: result.remainingResources
      });

    } catch (error) {
      console.error('[DefenseBuildingRoutes] Error building defense:', error);

      // Propager les erreurs métier avec leur message exact
      if (error && error.message) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Fallback vraiment inattendu
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la construction de la défense' 
      });
    }
  });

  /**
   * GET /api/v1/defenses/player
   * Get all defenses for the current player
   */
  router.get('/player', moderateLimiter, protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const defenses = await defenseBuildingService.getPlayerDefenses(userId);

      res.json({
        success: true,
        defenses
      });

    } catch (error) {
      console.error('[DefenseBuildingRoutes] Error fetching player defenses:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des défenses' 
      });
    }
  });

  return router;
};
