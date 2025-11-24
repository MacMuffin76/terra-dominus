const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createTrainingRouter = (container) => {
  const router = Router();
  const controller = container.resolve('trainingController');

  router.get('/training-centers', protect, controller.getTrainingCenters);
  router.get('/training-centers/:id', protect, controller.getTrainingDetails);
  router.post('/training-centers/:id/upgrade', protect, controller.upgradeTraining);
  router.post('/training-centers/:id/destroy', protect, controller.destroyTraining);

  return router;
};

module.exports = createTrainingRouter;