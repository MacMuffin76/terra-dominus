const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createDefenseUnlockRouter = (container) => {
  const router = Router();
  const defenseUnlockService = container.resolve('defenseUnlockService');

  /**
   * GET /api/defense/unlock/available
   * Obtenir toutes les défenses débloquées et verrouillées
   */
  router.get('/available', protect, async (req, res) => {
    try {
      const data = await defenseUnlockService.getAvailableDefenses(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting available defenses');
      res.status(500).json({ message: 'Error fetching defenses', error: error.message });
    }
  });

  /**
   * GET /api/defense/unlock/check/:defenseId
   * Vérifier si une défense est débloquée
   */
  router.get('/check/:defenseId', protect, async (req, res) => {
    try {
      const data = await defenseUnlockService.checkDefenseUnlock(req.user.id, req.params.defenseId);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error checking defense unlock');
      res.status(500).json({ message: 'Error checking defense', error: error.message });
    }
  });

  /**
   * GET /api/defense/unlock/tiers
   * Obtenir le résumé des tiers
   */
  router.get('/tiers', protect, async (req, res) => {
    try {
      const { buildings } = await defenseUnlockService.getAvailableDefenses(req.user.id);
      const tiers = defenseUnlockService.getTiersSummary(buildings.defenseWorkshopLevel);
      res.json(tiers);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting defense tiers');
      res.status(500).json({ message: 'Error fetching tiers', error: error.message });
    }
  });

  return router;
};

module.exports = createDefenseUnlockRouter;
