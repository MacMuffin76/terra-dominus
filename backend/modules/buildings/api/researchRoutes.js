const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createResearchRouter = (container) => {
  const router = Router();
  const controller = container.resolve('researchController');

  router.get('/research-items', protect, controller.getResearchItems);
  router.get('/research-items/:id', protect, controller.getResearchDetails);
  router.post('/research-items/:id/upgrade', protect, controller.upgradeResearch);
  router.post('/research-items/:id/destroy', protect, controller.destroyResearch);

  return router;
};

module.exports = createResearchRouter;