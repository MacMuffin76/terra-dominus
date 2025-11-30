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
      sequelize
    });
  });

  container.register('combatController', (c) => {
    const createCombatController = require('./modules/combat/api/combatController');
    return createCombatController({
      combatService: c.resolve('combatService'),
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

  // Portal Service
  container.register('portalRepository', () => {
    const PortalRepository = require('./modules/portals/infra/PortalRepository');
    return new PortalRepository();
  });

  container.register('portalService', (c) => {
    const PortalService = require('./modules/portals/application/PortalService');
    const { CityRepository } = require('./modules/buildings/infra/SequelizeRepositories');
    return new PortalService({
      portalRepository: c.resolve('portalRepository'),
      cityRepository: new CityRepository()
    });
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