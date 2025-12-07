class Container {
  constructor() {
    this.registrations = new Map();
    this.cache = new Map();
  }

  register(name, resolver) {
    this.registrations.set(name, resolver);
  }

  resolve(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    if (!this.registrations.has(name)) {
      throw new Error(`Dependency not registered: ${name}`);
    }

    const resolver = this.registrations.get(name);
    const value = resolver(this);
    this.cache.set(name, value);
    return value;
  }
}

const createContainer = () => {
  const container = new Container();

  container.register('resourceService', () => require('./services/resourceService'));

  container.register('analyticsService', () => {
    const { getAnalyticsService } = require('./services/analyticsService');
    return getAnalyticsService();
  });
  
  // Production calculator service
  container.register('productionCalculatorService', () => {
    const ProductionCalculatorService = require('./modules/resources/application/ProductionCalculatorService');
    const { Building, Research, Facility, City } = require('./models');
    const ResourceProduction = require('./models/ResourceProduction');
    return new ProductionCalculatorService({ Building, Research, Facility, City, ResourceProduction });
  });
  
  container.register('buildingService', () => {
    const BuildingService = require('./modules/buildings/application/BuildingService');
    const {
      BuildingRepository,
      ResourceRepository,
      ResourceCostRepository,
      EntityRepository,
      ConstructionOrderRepository,
      QueueEventPublisher,
      CityRepository,
      transactionProvider,
    } = require('./modules/buildings/infra/SequelizeRepositories');
    const { getIO } = require('./socket');

    return new BuildingService({
      buildingRepository: new BuildingRepository(),
      resourceRepository: new ResourceRepository(),
      resourceCostRepository: new ResourceCostRepository(),
      constructionOrderRepository: new ConstructionOrderRepository(),
      entityRepository: new EntityRepository(),
      queueEventPublisher: new QueueEventPublisher(getIO),
      cityRepository: new CityRepository(),
      transactionProvider,
    });
  });
  container.register('blueprintRepository', () => {
    const BlueprintRepository = require('./repositories/BlueprintRepository');
    return new BlueprintRepository();
  });

  container.register('battleReportRepository', () => {
    const BattleReportRepository = require('./modules/combat/infra/BattleReportRepository');
    return new BattleReportRepository();
  });
  container.register('combatSimulationService', (c) => {
    const CombatSimulationService = require('./modules/combat/application/CombatSimulationService');
    return new CombatSimulationService({ battleReportRepository: c.resolve('battleReportRepository') });
  });
  container.register('userService', () => require('./services/userService'));
  container.register('tokenService', () => {
    const { getTokenService } = require('./services/TokenService');
    return getTokenService();
  });

  container.register('resourceController', (c) => require('./controllers/resourceController')({ resourceService: c.resolve('resourceService') }));
  container.register('buildingController', (c) => require('./controllers/buildingController')({ buildingService: c.resolve('buildingService') }));
  container.register('authController', (c) => require('./controllers/authController')({ 
    userService: c.resolve('userService'),
    tokenService: c.resolve('tokenService')
  }));
  container.register('blueprintController', (c) => require('./controllers/blueprintController')({ blueprintRepository: c.resolve('blueprintRepository') }));

  container.register('facilityController', () => require('./controllers/facilityController'));
  container.register('researchController', () => require('./controllers/researchController'));
  container.register('trainingController', () => require('./controllers/trainingController'));
  container.register('defenseController', () => require('./controllers/defenseController'));
  container.register('unitController', () => require('./controllers/unitController'));
  container.register('dashboardController', () => require('./controllers/dashboardController'));

  // World & Colonization modules
  container.register('worldRepository', () => {
    const WorldRepository = require('./modules/world/infra/WorldRepository');
    return new WorldRepository();
  });

  container.register('worldService', (c) => {
    const WorldService = require('./modules/world/application/WorldService');
    return new WorldService({
      worldRepository: c.resolve('worldRepository'),
    });
  });

  container.register('worldController', (c) => {
    const createWorldController = require('./modules/world/api/worldController');
    return createWorldController({
      worldService: c.resolve('worldService'),
    });
  });

  container.register('colonizationRepository', () => {
    const ColonizationRepository = require('./modules/colonization/infra/ColonizationRepository');
    return new ColonizationRepository();
  });

  container.register('colonizationService', (c) => {
    const ColonizationService = require('./modules/colonization/application/ColonizationService');
    return new ColonizationService({
      colonizationRepository: c.resolve('colonizationRepository'),
      worldRepository: c.resolve('worldRepository'),
    });
  });

  container.register('colonizationController', (c) => {
    const createColonizationController = require('./modules/colonization/api/colonizationController');
    return createColonizationController({
      colonizationService: c.resolve('colonizationService'),
    });
  });

  // Combat module (attaques territoriales + espionnage)
  container.register('combatRepository', () => {
    const CombatRepository = require('./modules/combat/infra/CombatRepository');
    const { Attack, AttackWave, DefenseReport, SpyMission, City, User, Entity, Unit } = require('./models');
    return new CombatRepository({ Attack, AttackWave, DefenseReport, SpyMission, City, User, Entity, Unit });
  });

  container.register('combatService', (c) => {
    const CombatService = require('./modules/combat/application/CombatService');
    const { City, Unit, Resource, Building, Research } = require('./models');
    const sequelize = require('./db');
    return new CombatService({
      combatRepository: c.resolve('combatRepository'),
      City,
      Unit,
      Resource,
      Building,
      Research,
      sequelize,
      playerPowerService: c.resolve('playerPowerService')
    });
  });

  container.register('upkeepService', () => {
    const UpkeepService = require('./modules/combat/application/UpkeepService');
    const { City, Unit, Resource } = require('./models');
    const sequelize = require('./db');
    return new UpkeepService({
      City,
      Unit,
      Resource,
      sequelize
    });
  });

  container.register('unitUnlockService', () => {
    const UnitUnlockService = require('./modules/combat/application/UnitUnlockService');
    const { User, Research, Building, Facility, City } = require('./models');
    const sequelize = require('./db');
    return new UnitUnlockService({
      User,
      Research,
      Building,
      Facility,
      City,
      sequelize
    });
  });

  container.register('unitTrainingService', () => {
    const UnitTrainingService = require('./modules/combat/application/UnitTrainingService');
    const { User, Unit, City, Resource, Facility } = require('./models');
    const sequelize = require('./db');
    return new UnitTrainingService({
      User,
      Unit,
      City,
      Resource,
      Facility,
      sequelize
    });
  });

  container.register('defenseBuildingService', () => {
    const DefenseBuildingService = require('./modules/combat/application/DefenseBuildingService');
    const { User, Defense, City, Resource, Facility } = require('./models');
    const sequelize = require('./db');
    return new DefenseBuildingService({
      User,
      Defense,
      City,
      Resource,
      Facility,
      sequelize
    });
  });

  container.register('defenseUnlockService', () => {
    const DefenseUnlockService = require('./modules/combat/application/DefenseUnlockService');
    const { User, Research, Building, Facility, City } = require('./models');
    const sequelize = require('./db');
    return new DefenseUnlockService({
      User,
      Research,
      Building,
      Facility,
      City,
      sequelize
    });
  });

  container.register('researchUnlockService', () => {
    const ResearchUnlockService = require('./modules/research/application/ResearchUnlockService');
    const { User, Research, Building, Facility, City } = require('./models');
    const sequelize = require('./db');
    return new ResearchUnlockService({
      User,
      Research,
      Building,
      Facility,
      City,
      sequelize
    });
  });

  container.register('facilityService', () => {
    const FacilityService = require('./modules/facilities/application/FacilityService');
    const { User, Facility, City } = require('./models');
    const sequelize = require('./db');
    return new FacilityService({
      User,
      Facility,
      City,
      sequelize
    });
  });

  container.register('facilityUnlockService', () => {
    const FacilityUnlockService = require('./modules/facilities/application/FacilityUnlockService');
    const { User, Facility, City } = require('./models');
    const sequelize = require('./db');
    return new FacilityUnlockService({
      User,
      Facility,
      City,
      sequelize
    });
  });

  container.register('combatController', (c) => {
    const createCombatController = require('./modules/combat/api/combatController');
    return createCombatController({
      combatService: c.resolve('combatService'),
    });
  });

  // PvP Balancing repositories
  container.register('cityRepository', () => {
    const { CityRepository } = require('./modules/buildings/infra/SequelizeRepositories');
    return new CityRepository();
  });

  container.register('userRepository', () => {
    const { User } = require('./models');
    return {
      findById: async (userId) => await User.findByPk(userId),
      findAll: async (options) => await User.findAll(options)
    };
  });

  container.register('cityRepository', () => {
    const { City } = require('./models');
    return {
      findByUserId: async (userId) => await City.findAll({ where: { user_id: userId } }),
      countByUserId: async (userId) => await City.count({ where: { user_id: userId } })
    };
  });

  // PvP Balancing (matchmaking, power calculation)
  container.register('playerPowerService', (c) => {
    const PlayerPowerService = require('./modules/combat/application/PlayerPowerService');
    return new PlayerPowerService({
      cityRepository: c.resolve('cityRepository'),
      userRepository: c.resolve('userRepository'),
    });
  });

  container.register('pvpBalancingController', (c) => {
    const createPvpBalancingController = require('./controllers/pvpBalancingController');
    const pvpBalancingRules = require('./modules/combat/domain/pvpBalancingRules');
    return createPvpBalancingController({
      playerPowerService: c.resolve('playerPowerService'),
      pvpBalancingRules,
    });
  });

  container.register('upkeepController', (c) => {
    const createUpkeepController = require('./controllers/upkeepController');
    return createUpkeepController({
      upkeepService: c.resolve('upkeepService'),
    });
  });

  container.register('unitUnlockController', (c) => {
    const createUnitUnlockController = require('./controllers/unitUnlockController');
    return createUnitUnlockController({
      unitUnlockService: c.resolve('unitUnlockService'),
    });
  });

  // Trade module (commerce inter-villes)
  container.register('tradeRepository', () => {
    const TradeRepository = require('./modules/trade/infra/TradeRepository');
    const { TradeRoute, TradeConvoy, City, User } = require('./models');
    return new TradeRepository({ TradeRoute, TradeConvoy, City, User });
  });

  container.register('tradeService', (c) => {
    const TradeService = require('./modules/trade/application/TradeService');
    const { City, Resource } = require('./models');
    const sequelize = require('./db');
    return new TradeService({
      tradeRepository: c.resolve('tradeRepository'),
      City,
      Resource,
      sequelize
    });
  });

  container.register('tradeController', (c) => {
    const createTradeController = require('./modules/trade/api/tradeController');
    return createTradeController({
      tradeService: c.resolve('tradeService'),
    });
  });

  // Alliance module (alliances/guildes)
  container.register('allianceService', () => {
    const AllianceService = require('./modules/alliances/application/AllianceService');
    return new AllianceService();
  });

  container.register('allianceController', (c) => {
    const createAllianceController = require('./modules/alliances/api/allianceController');
    return createAllianceController({
      allianceService: c.resolve('allianceService'),
    });
  });

  // City module (specializations)
  container.register('cityService', () => {
    const CityService = require('./modules/cities/application/CityService');
    return new CityService();
  });

  container.register('cityController', (c) => {
    const createCityController = require('./modules/cities/api/cityController');
    return createCityController({
      cityService: c.resolve('cityService'),
    });
  });

  // Market module (trading system)
  container.register('marketService', () => {
    const MarketService = require('./modules/market/application/MarketService');
    return new MarketService();
  });

  container.register('marketController', (c) => {
    const createMarketController = require('./modules/market/api/marketController');
    return createMarketController({
      marketService: c.resolve('marketService'),
    });
  });

  // Portal System - New Phase 3 implementation
  container.register('portalRepository', () => {
    const PortalRepository = require('./modules/portals/infra/PortalRepository');
    const { Portal } = require('./models');
    return new PortalRepository({ Portal });
  });

  container.register('portalAttemptRepository', () => {
    const PortalAttemptRepository = require('./modules/portals/infra/PortalAttemptRepository');
    const { PortalAttempt } = require('./models');
    return new PortalAttemptRepository({ PortalAttempt });
  });

  container.register('portalMasteryRepository', () => {
    const PortalMasteryRepository = require('./modules/portals/infra/PortalMasteryRepository');
    const { PortalMastery } = require('./models');
    return new PortalMasteryRepository({ PortalMastery });
  });

  container.register('portalCombatService', (c) => {
    const PortalCombatService = require('./modules/portals/application/PortalCombatService');
    return new PortalCombatService({
      portalRepository: c.resolve('portalRepository'),
      portalAttemptRepository: c.resolve('portalAttemptRepository'),
      userRepository: c.resolve('userRepository'),
      unitRepository: null, // TODO: Implement unit repository
      questService: c.resolve('portalQuestService'),
    });
  });

  container.register('portalSpawnerService', (c) => {
    const PortalSpawnerService = require('./modules/portals/application/PortalSpawnerService');
    return new PortalSpawnerService({
      portalRepository: c.resolve('portalRepository'),
      rewardsConfigRepository: null, // Uses in-memory config
    });
  });

  container.register('portalService', (c) => {
    const PortalService = require('./modules/portals/application/PortalService');
    return new PortalService({
      portalRepository: c.resolve('portalRepository'),
      portalAttemptRepository: c.resolve('portalAttemptRepository'),
      portalMasteryRepository: c.resolve('portalMasteryRepository'),
      portalCombatService: c.resolve('portalCombatService'),
      userRepository: c.resolve('userRepository'),
    });
  });

  container.register('portalBossRepository', () => {
    const PortalBossRepository = require('./modules/portals/infra/PortalBossRepository');
    const models = require('./models');
    return new PortalBossRepository({ models });
  });

  container.register('portalRaidRepository', () => {
    const PortalRaidRepository = require('./modules/portals/infra/PortalRaidRepository');
    const models = require('./models');
    return new PortalRaidRepository({ models });
  });

  container.register('portalBossCombatService', (c) => {
    const PortalBossCombatService = require('./modules/portals/application/PortalBossCombatService');
    const models = require('./models');
    return new PortalBossCombatService({
      portalRepository: c.resolve('portalRepository'),
      portalAttemptRepository: c.resolve('portalAttemptRepository'),
      userRepository: c.resolve('userRepository'),
      unitRepository: null,
      models,
      questService: c.resolve('portalQuestService'),
    });
  });

  container.register('portalController', (c) => {
    const createPortalController = require('./controllers/portalController');
    return createPortalController({
      portalService: c.resolve('portalService'),
      portalSpawnerService: c.resolve('portalSpawnerService'),
    });
  });

  container.register('portalBossController', (c) => {
    const createPortalBossController = require('./controllers/portalBossController');
    return createPortalBossController({
      portalBossCombatService: c.resolve('portalBossCombatService'),
      portalBossRepository: c.resolve('portalBossRepository'),
      portalRaidRepository: c.resolve('portalRaidRepository'),
    });
  });

  // Portal Quest System (new)
  container.register('portalQuestRepository', (c) => {
    const createQuestRepository = require('./modules/quests/infra/QuestRepository');
    const models = require('./models');
    const logger = require('./utils/logger');
    return createQuestRepository({ models, logger, traceId: 'portal-quest-repository' });
  });

  container.register('portalQuestService', (c) => {
    const createQuestService = require('./modules/quests/application/QuestService');
    const logger = require('./utils/logger');
    return createQuestService({
      questRepository: c.resolve('portalQuestRepository'),
      logger,
      traceId: 'portal-quest-service',
    });
  });

  container.register('portalQuestController', (c) => {
    const createQuestController = require('./controllers/portalQuestController');
    return createQuestController({
      questService: c.resolve('portalQuestService'),
    });
  });

  container.register('userRepository', () => {
    const { User } = require('./models');
    return { findById: (id) => User.findByPk(id) };
  });

  // Tutorial Service
  container.register('tutorialService', () => {
    const TutorialService = require('./modules/tutorial/application/TutorialService');
    const sequelize = require('./db');
    return new TutorialService({ sequelize });
  });

  container.register('tutorialController', (c) => {
    const createTutorialController = require('./controllers/tutorialController');
    return createTutorialController({
      tutorialService: c.resolve('tutorialService'),
    });
  });

  // Quest Service
  container.register('questRepository', () => {
    const SequelizeQuestRepository = require('./modules/quest/infra/SequelizeQuestRepository');
    const { Quest, UserQuest, User } = require('./models');
    const sequelize = require('./db');
    return new SequelizeQuestRepository({ Quest, UserQuest, User, sequelize });
  });

  container.register('questService', (c) => {
    const QuestService = require('./modules/quest/application/QuestService');
    return new QuestService({
      questRepository: c.resolve('questRepository')
    });
  });

  container.register('questController', (c) => {
    const createQuestController = require('./controllers/questController');
    return createQuestController({
      questService: c.resolve('questService'),
    });
  });

  // Achievement Service
  container.register('achievementRepository', () => {
    const SequelizeAchievementRepository = require('./modules/achievement/infra/SequelizeAchievementRepository');
    const { Achievement, UserAchievement, User } = require('./models');
    const sequelize = require('./db');
    return new SequelizeAchievementRepository({ Achievement, UserAchievement, User, sequelize });
  });

  container.register('achievementService', (c) => {
    const AchievementService = require('./modules/achievement/application/AchievementService');
    return new AchievementService({
      achievementRepository: c.resolve('achievementRepository')
    });
  });

  container.register('achievementController', (c) => {
    const createAchievementController = require('./controllers/achievementController');
    return createAchievementController({
      achievementService: c.resolve('achievementService'),
    });
  });

  // Battle Pass
  container.register('battlePassService', () => {
    const BattlePassService = require('./modules/battlepass/application/BattlePassService');
    return new BattlePassService();
  });

  container.register('battlePassController', (c) => {
    const createBattlePassController = require('./controllers/battlePassController');
    return createBattlePassController({
      battlePassService: c.resolve('battlePassService'),
    });
  });

  // Leaderboard Service et Controller
  container.register('leaderboardService', () => {
    return require('./modules/leaderboard/application/LeaderboardService');
  });

  container.register('leaderboardController', (c) => {
    return require('./controllers/leaderboardController');
  });

  // Chat Service et Controller
  container.register('chatRepository', () => {
    const ChatRepository = require('./modules/chat/infra/ChatRepository');
    return new ChatRepository();
  });

  container.register('chatService', (c) => {
    const ChatService = require('./modules/chat/application/ChatService');
    return new ChatService(c.resolve('chatRepository'));
  });

  container.register('chatController', (c) => {
    const createChatController = require('./controllers/chatController');
    return createChatController({
      chatService: c.resolve('chatService'),
    });
  });

  // Alliance War System
  container.register('allianceWarRepository', () => {
    const AllianceWarRepository = require('./modules/alliances/infra/AllianceWarRepository');
    return new AllianceWarRepository();
  });

  container.register('allianceWarService', (c) => {
    const AllianceWarService = require('./modules/alliances/application/AllianceWarService');
    return new AllianceWarService(c.resolve('allianceWarRepository'));
  });

  container.register('allianceWarController', (c) => {
    const createAllianceWarController = require('./controllers/allianceWarController');
    return createAllianceWarController({
      allianceWarService: c.resolve('allianceWarService'),
    });
  });

  // Resource T2 System
  container.register('resourceT2Repository', () => {
    return require('./repositories/ResourceT2Repository');
  });

  container.register('resourceT2Service', (c) => {
    const ResourceT2Service = require('./services/ResourceT2Service');
    return new ResourceT2Service(c.resolve('resourceT2Repository'));
  });

  container.register('resourceT2Controller', (c) => {
    const createResourceT2Controller = require('./controllers/resourceT2Controller');
    return createResourceT2Controller({
      resourceT2Service: c.resolve('resourceT2Service'),
    });
  });

  // Crafting System
  container.register('craftingRepository', () => {
    const CraftingRepository = require('./repositories/CraftingRepository');
    return new CraftingRepository();
  });

  container.register('craftingService', (c) => {
    const CraftingService = require('./services/CraftingService');
    return new CraftingService({
      craftingRepository: c.resolve('craftingRepository'),
    });
  });

  container.register('craftingController', (c) => {
    const createCraftingController = require('./controllers/craftingController');
    return createCraftingController({
      craftingService: c.resolve('craftingService'),
    });
  });

  // Factions & Territorial Control System
  container.register('factionRepository', () => {
    const FactionRepository = require('./repositories/FactionRepository');
    return new FactionRepository();
  });

  container.register('factionService', (c) => {
    const FactionService = require('./services/FactionService');
    return new FactionService({
      factionRepository: c.resolve('factionRepository'),
    });
  });

  container.register('factionController', (c) => {
    const createFactionController = require('./controllers/factionController');
    return createFactionController({
      factionService: c.resolve('factionService'),
    });
  });

  // Queues for workers
  const { getQueue, queueNames } = require('./jobs/queueConfig');
  container.register('colonizationQueue', () => getQueue(queueNames.COLONIZATION));
  container.register('attackQueue', () => getQueue(queueNames.ATTACK));
  container.register('spyQueue', () => getQueue(queueNames.SPY));
  container.register('tradeQueue', () => getQueue(queueNames.TRADE));
  container.register('portalQueue', () => getQueue(queueNames.PORTAL));

  return container;
};

module.exports = createContainer;