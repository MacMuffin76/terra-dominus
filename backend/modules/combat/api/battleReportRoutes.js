const express = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createBattleReportRouter = ({ battleReportService }) => {
  const router = express.Router();

  router.use(protect);

  router.get('/', async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await battleReportService.listForUser(req.user.id, { page, limit });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = createBattleReportRouter;