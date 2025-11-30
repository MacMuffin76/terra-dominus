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
const createAllianceRouter = require('../modules/alliances/api/allianceRoutes');
const createCityRouter = require('../modules/cities/api/cityRoutes');
const createMarketRouter = require('../modules/market/api/marketRoutes');
const createPortalRouter = require('../modules/portals/api/portalRoutes');
const createPortalBossRouter = require('../modules/portals/api/portalBossRoutes');
const protectionRoutes = require('../routes/protectionRoutes');
const createTutorialRouter = require('../routes/tutorialRoutes');
const createQuestRouter = require('../routes/questRoutes');
const createAchievementRouter = require('../routes/achievementRoutes');
const createBattlePassRouter = require('../routes/battlePassRoutes');
const createLeaderboardRouter = require('../routes/leaderboardRoutes');
const createChatRouter = require('../routes/chatRoutes');
const territoryRoutes = require('../routes/territoryRoutes');
const createWarRouter = require('../routes/warRoutes');
const createResourceT2Router = require('../routes/resourceT2Routes');
const createCraftingRouter = require('../routes/craftingRoutes');
const createFactionRouter = require('../routes/factionRoutes');
const createUpkeepRouter = require('../routes/upkeepRoutes');
const createUnitUnlockRouter = require('../routes/unitUnlockRoutes');

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
  router.use('/pvp', require('../routes/pvpBalancingRoutes')(
    container.resolve('pvpBalancingController'),
    require('../middleware/authMiddleware')
  ));
  router.use('/trade', createTradeRouter(container));
  router.use('/alliances', createAllianceRouter({
    allianceController: container.resolve('allianceController'),
    authMiddleware: require('../middleware/authMiddleware'),
    warController: container.resolve('allianceWarController')
  }));
  router.use('/cities', createCityRouter(container.resolve('cityController')));
  router.use('/market', createMarketRouter({
    marketController: container.resolve('marketController'),
    authMiddleware: require('../middleware/authMiddleware')
  }));
  router.use('/portals', createPortalRouter({
    portalController: container.resolve('portalController'),
    authMiddleware: require('../middleware/authMiddleware'),
    adminMiddleware: require('../middleware/adminMiddleware')
  }));
  router.use('/portals', createPortalBossRouter({
    portalBossController: container.resolve('portalBossController'),
    authMiddleware: require('../middleware/authMiddleware'),
    adminMiddleware: require('../middleware/adminMiddleware')
  }));
  router.use('/portal-quests', require('../modules/quests/api/portalQuestRoutes')(container));
  router.use('/protection', protectionRoutes);
  router.use('/tutorial', createTutorialRouter(container));
  router.use('/quests', createQuestRouter(container.resolve('questController')));
  router.use('/achievements', createAchievementRouter(container.resolve('achievementController')));
  router.use('/battlepass', createBattlePassRouter(container.resolve('battlePassController')));
  router.use('/leaderboards', createLeaderboardRouter());
  router.use('/chat', createChatRouter({
    chatController: container.resolve('chatController')
  }));
  router.use('/territories', territoryRoutes);
  router.use('/wars', createWarRouter({
    warController: container.resolve('allianceWarController'),
    authMiddleware: require('../middleware/authMiddleware')
  }));
  router.use('/resources/t2', createResourceT2Router({
    resourceT2Controller: container.resolve('resourceT2Controller'),
    authMiddleware: require('../middleware/authMiddleware')
  }));
  router.use('/crafting', createCraftingRouter(container.resolve('craftingController')));
  router.use('/factions', createFactionRouter(container.resolve('factionController')));
  router.use('/upkeep', createUpkeepRouter(container));
  router.use('/units/unlock', createUnitUnlockRouter(container));
  router.use('/', createDashboardRouter(container));
  router.use('/', createUnitRouter(container));
  router.use('/admin', createBlueprintAdminRouter(container));

  return router;
};

module.exports = createApiRouter;