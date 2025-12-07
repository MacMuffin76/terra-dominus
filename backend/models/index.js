/**
 * Modèles Sequelize - Index centralisé
 * Charge et initialise tous les modèles avec leurs associations
 */

const sequelize = require('../db');

// Import des modèles anciens (déjà initialisés avec sequelize.define)
const User = require('./User');
const City = require('./City');
const Entity = require('./Entity');
const Building = require('./Building');
const Facility = require('./Facility');
const Research = require('./Research');
const Training = require('./Training');
const Defense = require('./Defense');
const Unit = require('./Unit');
const Resource = require('./Resource');
const ResourceCost = require('./ResourceCost');
const ResourceProduction = require('./ResourceProduction');
const RefreshToken = require('./RefreshToken');
const ConstructionQueue = require('./ConstructionQueue');
const BattleReport = require('./BattleReport');
const BlueprintAudit = require('./BlueprintAudit');

// Import des modèles du système monde (déjà initialisés avec sequelize.define)
const WorldGrid = require('./WorldGrid');
const CitySlot = require('./CitySlot');
const ExploredTile = require('./ExploredTile');
const ColonizationMission = require('./ColonizationMission');

// Import des modèles combat/trade (classes qui nécessitent .init())
const Attack = require('./Attack');
const AttackWave = require('./AttackWave');
const DefenseReport = require('./DefenseReport');
const SpyMission = require('./SpyMission');
const TradeRoute = require('./TradeRoute');
const TradeConvoy = require('./TradeConvoy');

// Import des modèles alliances
const Alliance = require('./Alliance');
const AllianceMember = require('./AllianceMember');
const AllianceInvitation = require('./AllianceInvitation');
const AllianceJoinRequest = require('./AllianceJoinRequest');
const AllianceDiplomacy = require('./AllianceDiplomacy');

// Import des modèles marché
const MarketOrder = require('./MarketOrder');
const MarketTransaction = require('./MarketTransaction');

// Import des modèles portails
const Portal = require('./Portal')(sequelize);
const PortalAttempt = require('./PortalAttempt')(sequelize);
const PortalMastery = require('./PortalMastery')(sequelize);
const PortalExpedition = require('./PortalExpedition');
const PortalBoss = require('./PortalBoss')(sequelize);
const PortalBossAttempt = require('./PortalBossAttempt')(sequelize);
const PortalAllianceRaid = require('./PortalAllianceRaid')(sequelize);
const PortalRaidParticipant = require('./PortalRaidParticipant')(sequelize);

// Import des modèles quêtes (anciens - legacy)
const Quest = require('./Quest');

// Import des nouveaux modèles portail quest system
const PortalQuest = require('./PortalQuest')(sequelize);
const UserQuest = require('./UserQuest')(sequelize);
const UserQuestUnlock = require('./UserQuestUnlock')(sequelize);
const DailyQuestRotation = require('./DailyQuestRotation')(sequelize);
const QuestStreak = require('./QuestStreak')(sequelize);

// Import des modèles achievements
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');

// Boutique / paiements
const ShopItem = require('./ShopItem');
const PaymentIntent = require('./PaymentIntentRecord');
const UserTransaction = require('./UserTransaction');

// Import des modèles battle pass
const BattlePassSeason = require('./BattlePassSeason')(sequelize);
const BattlePassReward = require('./BattlePassReward')(sequelize);
const UserBattlePass = require('./UserBattlePass')(sequelize);
const UserBattlePassReward = require('./UserBattlePassReward')(sequelize);

// Import des modèles leaderboards
const LeaderboardEntry = require('./LeaderboardEntry')(sequelize);
const LeaderboardReward = require('./LeaderboardReward')(sequelize);
const UserLeaderboardReward = require('./UserLeaderboardReward')(sequelize);

// Import du modèle chat
const ChatMessage = require('./ChatMessage')(sequelize);

// Import des nouveaux modèles alliance (treasury, territories, wars)
const AllianceTreasuryLog = require('./AllianceTreasuryLog')(sequelize);
const AllianceTerritory = require('./AllianceTerritory')(sequelize);
const AllianceWar = require('./AllianceWar')(sequelize);
const AllianceWarBattle = require('./AllianceWarBattle')(sequelize);

// Import des modèles T2 Resources
const UserResourceT2 = require('./UserResourceT2')(sequelize);
const ResourceConversion = require('./ResourceConversion')(sequelize);
const ResourceConversionRecipe = require('./ResourceConversionRecipe')(sequelize);

// Import des modèles unit system (PvP balance)
const UnitStats = require('./UnitStats');
const UnitUpkeep = require('./UnitUpkeep');

// Import des modèles Crafting & Blueprints
const BlueprintCrafting = require('./Blueprint')(sequelize);
const PlayerBlueprint = require('./PlayerBlueprint')(sequelize);
const CraftingQueue = require('./CraftingQueue')(sequelize);
const PlayerCraftingStats = require('./PlayerCraftingStats')(sequelize);

// Import des modèles Factions & Territorial Control
const Faction = require('./Faction')(sequelize);
const ControlZone = require('./ControlZone')(sequelize);
const FactionControlPoints = require('./FactionControlPoints')(sequelize);
const UserFaction = require('./UserFaction')(sequelize);

// Initialiser les nouveaux modèles (classes)
Attack.init(sequelize);
AttackWave.init(sequelize);
DefenseReport.init(sequelize);
SpyMission.init(sequelize);
TradeRoute.init(sequelize);
TradeConvoy.init(sequelize);
// Portal now uses factory function pattern, no need for init
PortalExpedition.init(sequelize);

// Définir les associations pour les quêtes (legacy)
// Note: UserQuest associations are defined in UserQuest.associate() method
Quest.hasMany(UserQuest, { foreignKey: 'quest_id', as: 'userQuests' });

// Définir les associations pour les achievements
Achievement.hasMany(UserAchievement, { foreignKey: 'achievement_id', as: 'userAchievements' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'achievement' });
User.hasMany(UserAchievement, { foreignKey: 'user_id', as: 'userAchievements' });
UserAchievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Définir les associations (si les modèles ont une méthode associate)
const models = {
  User,
  City,
  Entity,
  Building,
  Facility,
  Research,
  Training,
  Defense,
  Unit,
  Resource,
  ResourceCost,
  ResourceProduction,
  RefreshToken,
  ConstructionQueue,
  BattleReport,
  BlueprintAudit,
  WorldGrid,
  CitySlot,
  ExploredTile,
  ColonizationMission,
  Attack,
  AttackWave,
  DefenseReport,
  SpyMission,
  TradeRoute,
  TradeConvoy,
  Alliance,
  AllianceMember,
  AllianceInvitation,
  AllianceJoinRequest,
  AllianceDiplomacy,
  MarketOrder,
  MarketTransaction,
  Portal,
  PortalAttempt,
  PortalMastery,
  PortalExpedition,
  PortalBoss,
  PortalBossAttempt,
  PortalAllianceRaid,
  PortalRaidParticipant,
  Quest,
  PortalQuest,
  UserQuest,
  UserQuestUnlock,
  DailyQuestRotation,
  QuestStreak,
  Achievement,
  UserAchievement,
  BattlePassSeason,
  BattlePassReward,
  UserBattlePass,
  UserBattlePassReward,
  LeaderboardEntry,
  LeaderboardReward,
  UserLeaderboardReward,
  ChatMessage,
  ShopItem,
  PaymentIntent,
  UserTransaction,
  AllianceTreasuryLog,
  AllianceTerritory,
  AllianceWar,
  AllianceWarBattle,
  UserResourceT2,
  ResourceConversion,
  ResourceConversionRecipe,
  BlueprintCrafting,
  PlayerBlueprint,
  CraftingQueue,
  PlayerCraftingStats,
  Faction,
  ControlZone,
  FactionControlPoints,
  UserFaction,
  UnitStats,
  UnitUpkeep
};

PaymentIntent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PaymentIntent.belongsTo(ShopItem, { foreignKey: 'shop_item_id', as: 'shopItem' });
ShopItem.hasMany(PaymentIntent, { foreignKey: 'shop_item_id', as: 'paymentIntents' });

UserTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserTransaction.belongsTo(PaymentIntent, { foreignKey: 'payment_intent_id', as: 'paymentIntent' });
UserTransaction.belongsTo(ShopItem, { foreignKey: 'shop_item_id', as: 'shopItem' });
User.hasMany(UserTransaction, { foreignKey: 'user_id', as: 'transactions' });
ShopItem.hasMany(UserTransaction, { foreignKey: 'shop_item_id', as: 'transactions' });


// Ajouter sequelize et Sequelize pour les associations
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
