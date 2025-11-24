const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createUnitRouter = (container) => {
  const router = Router();
  const controller = container.resolve('unitController');

  router.get('/units', protect, controller.getUserUnits);

  return router;
};

module.exports = createUnitRouter;