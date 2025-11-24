const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  upgradeBuildingSchema,
  saveUserResourcesSchema,
} = require('../../../validation/resourceValidation');

const createResourceRouter = (container) => {
  const router = Router();
  const controller = container.resolve('resourceController');

  // 👇 LOG pour vérifier que ce fichier est bien chargé
  console.log('[resourceRoutes] router initialized');

  // ✅ Route de test NON protégée
  router.get('/ping', (req, res) => {
    console.log('[resourceRoutes] /ping called');
    res.json({ status: 'OK', time: new Date().toISOString() });
  });

  router.get('/resource-buildings', protect, controller.getResourceBuildings);
  router.get('/resource-buildings/:id', protect, controller.getBuildingDetails);
  router.post(
    '/resource-buildings/:id/upgrade',
    protect,
    validate(upgradeBuildingSchema),
    controller.upgradeBuilding
  );
  router.post(
    '/resource-buildings/:id/downgrade',
    protect,
    controller.downgradeBuilding
  );
  router.post(
    '/resource-buildings/:id/destroy',
    protect,
    controller.destroyBuilding
  );
  router.get('/user-resources', protect, controller.getUserResources);
  router.post(
    '/save',
    protect,
    validate(saveUserResourcesSchema),
    controller.saveUserResources
  );

  return router;
};

module.exports = createResourceRouter;
