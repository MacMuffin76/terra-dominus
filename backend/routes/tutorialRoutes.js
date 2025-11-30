const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const createTutorialRouter = (container) => {
  const router = express.Router();
  const tutorialController = container.resolve('tutorialController');

  /**
   * @openapi
   * /tutorial/progress:
   *   get:
   *     summary: Get current user's tutorial progress
   *     tags: [Tutorial]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tutorial progress
   */
  router.get('/progress', protect, tutorialController.getProgress);

  /**
   * @openapi
   * /tutorial/complete-step:
   *   post:
   *     summary: Complete a tutorial step
   *     tags: [Tutorial]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - stepId
   *             properties:
   *               stepId:
   *                 type: integer
   *                 example: 3
   *               actionData:
   *                 type: object
   *                 example: { buildingName: "Mine d'or", level: 1 }
   *     responses:
   *       200:
   *         description: Step completed
   */
  router.post('/complete-step', protect, tutorialController.completeStep);

  /**
   * @openapi
   * /tutorial/skip:
   *   post:
   *     summary: Skip tutorial
   *     tags: [Tutorial]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tutorial skipped
   */
  router.post('/skip', protect, tutorialController.skipTutorial);

  /**
   * @openapi
   * /tutorial/reset:
   *   post:
   *     summary: Reset tutorial (for replay)
   *     tags: [Tutorial]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tutorial reset
   */
  router.post('/reset', protect, tutorialController.resetTutorial);

  /**
   * @openapi
   * /tutorial/statistics:
   *   get:
   *     summary: Get tutorial statistics
   *     tags: [Tutorial]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tutorial statistics
   */
  router.get('/statistics', protect, tutorialController.getStatistics);

  return router;
};

module.exports = createTutorialRouter;
