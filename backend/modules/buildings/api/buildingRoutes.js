const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createBuildingRouter = (container) => {
  const router = Router();
  const controller = container.resolve('buildingController');

  router.get('/construction/queue', protect, controller.listConstructionQueue);
  router.delete('/construction/queue/:id', protect, controller.cancelConstruction);
  router.post('/construction/queue/:id/accelerate', protect, controller.accelerateConstruction);
  router.get('/:id', protect, controller.getBuildingDetails);
  router.post('/:id/upgrade', protect, controller.upgradeBuilding);
  router.post('/:id/downgrade', protect, controller.downgradeBuilding);

  return router;
};

module.exports = createBuildingRouter;