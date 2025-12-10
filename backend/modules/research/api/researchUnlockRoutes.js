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
      const status = error.status || 500;
      const message = error.message || 'Error starting research';
      res.status(status).json({ message, error: error.message });
    }
  });

  router.get('/queue', protect, async (req, res) => {
    try {
      const queue = await researchUnlockService.listResearchQueue(req.user.id);
      res.json(queue);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error listing research queue');
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  router.post('/queue/:id/accelerate', protect, async (req, res) => {
    try {
      const result = await researchUnlockService.accelerateResearch(req.user.id, req.params.id);
      res.json(result);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error accelerating research');
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  router.post('/queue/:id/cancel', protect, async (req, res) => {
    try {
      const result = await researchUnlockService.cancelResearch(req.user.id, req.params.id);
      res.json(result);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error cancelling research');
      res.status(error.status || 500).json({ message: error.message });
    }
  });


  return router;
};

module.exports = createResearchUnlockRouter;
