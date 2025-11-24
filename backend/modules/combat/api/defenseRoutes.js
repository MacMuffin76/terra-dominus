const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createDefenseRouter = (container) => {
  const router = Router();
  const controller = container.resolve('defenseController');

  router.get('/defenses', protect, controller.getDefenses);
  router.get('/defense-buildings/:id', protect, controller.getDefenseDetails);
  router.post('/defense-buildings/:id/buy', protect, controller.buyDefenseUnit);

  return router;
};

module.exports = createDefenseRouter;