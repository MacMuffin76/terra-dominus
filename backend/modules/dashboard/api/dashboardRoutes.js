const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createDashboardRouter = (container) => {
  const router = Router();
  const controller = container.resolve('dashboardController');

  router.get('/dashboard', protect, controller.getDashboardData);

  return router;
};

module.exports = createDashboardRouter;