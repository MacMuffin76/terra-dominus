const { Router } = require('express');
const createAuthRouter = require('../modules/auth/api/authRoutes');
const createResourceRouter = require('../modules/resources/api/resourceRoutes');
const createBuildingRouter = require('../modules/buildings/api/buildingRoutes');
const createFacilityRouter = require('../modules/buildings/api/facilityRoutes');
const createResearchRouter = require('../modules/buildings/api/researchRoutes');
const createTrainingRouter = require('../modules/buildings/api/trainingRoutes');
const createDefenseRouter = require('../modules/combat/api/defenseRoutes');
const createUnitRouter = require('../modules/units/api/unitRoutes');
const createDashboardRouter = require('../modules/dashboard/api/dashboardRoutes');
const createBlueprintAdminRouter = require('../modules/admin/api/blueprintRoutes');
const createWorldRouter = require('../modules/world/api/worldRoutes');
const createColonizationRouter = require('../modules/colonization/api/colonizationRoutes');
const createCombatRouter = require('../modules/combat/api/combatRoutes');
const createTradeRouter = require('../modules/trade/api/tradeRoutes');

const createApiRouter = (container) => {
  const router = Router();

  router.use('/auth', createAuthRouter(container));
  router.use('/resources', createResourceRouter(container));
  router.use('/buildings', createBuildingRouter(container));
  router.use('/facilities', createFacilityRouter(container));
  router.use('/research', createResearchRouter(container));
  router.use('/training', createTrainingRouter(container));
  router.use('/defense', createDefenseRouter(container));
  router.use('/world', createWorldRouter(container));
  router.use('/colonization', createColonizationRouter(container));
  router.use('/combat', createCombatRouter(container));
  router.use('/trade', createTradeRouter(container));
  router.use('/cities', require('../modules/cities/api/citiesRoutes')());
  router.use('/', createDashboardRouter(container));
  router.use('/', createUnitRouter(container));
  router.use('/admin', createBlueprintAdminRouter(container));

  return router;
};

module.exports = createApiRouter;