const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createResearchUnlockRouter = (container) => {
  const router = Router();
  const researchUnlockService = container.resolve('researchUnlockService');

  /**
   * GET /api/research/unlock/available
   * Obtenir toutes les recherches (disponibles, en cours, complétées, verrouillées)
   */
  router.get('/available', protect, async (req, res) => {
    try {
      const data = await researchUnlockService.getAvailableResearch(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting available research');
      res.status(500).json({ message: 'Error fetching research', error: error.message });
    }
  });

  /**
   * GET /api/research/unlock/check/:researchId
   * Vérifier si une recherche est disponible
   */
  router.get('/check/:researchId', protect, async (req, res) => {
    try {
      const data = await researchUnlockService.checkResearchAvailability(req.user.id, req.params.researchId);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error checking research availability');
      res.status(500).json({ message: 'Error checking research', error: error.message });
    }
  });

  /**
   * GET /api/research/unlock/category/:category
   * Obtenir les recherches par catégorie
   */
  router.get('/category/:category', protect, async (req, res) => {
    try {
      const data = await researchUnlockService.getResearchByCategory(req.user.id, req.params.category);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting research by category');
      res.status(500).json({ message: 'Error fetching research category', error: error.message });
    }
  });

  /**
   * POST /api/research/unlock/start/:researchId
   * Démarrer ou upgrader une recherche
   */
  router.post('/start/:researchId', protect, async (req, res) => {
    try {
      const result = await researchUnlockService.startResearch(req.user.id, req.params.researchId);
      res.json(result);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error starting research');
      res.status(500).json({ message: 'Error starting research', error: error.message });
    }
  });

  return router;
};

module.exports = createResearchUnlockRouter;
