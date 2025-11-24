const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const { adminOnly } = require('../../../middleware/adminMiddleware');

const createBlueprintAdminRouter = (container) => {
  const router = Router();
  const controller = container.resolve('blueprintController');

  router.get('/blueprints', protect, adminOnly, controller.listBlueprints);
  router.put('/blueprints/:id', protect, adminOnly, controller.updateBlueprint);

  return router;
};

module.exports = createBlueprintAdminRouter;