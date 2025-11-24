const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createFacilityRouter = (container) => {
  const router = Router();
  const controller = container.resolve('facilityController');

  router.get('/facility-buildings', protect, controller.getFacilityBuildings);
  router.get('/facility-buildings/:id', protect, controller.getFacilityDetails);
  router.post('/facility-buildings/:id/upgrade', protect, controller.upgradeFacility);
  router.post('/facility-buildings/:id/downgrade', protect, controller.downgradeFacility);
  router.post('/facility-buildings/:id/destroy', protect, controller.destroyFacility);

  return router;
};

module.exports = createFacilityRouter;