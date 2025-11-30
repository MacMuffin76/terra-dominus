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
const Blueprint = require('./Blueprint');
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
const Portal = require('./Portal');
const PortalExpedition = require('./PortalExpedition');

// Import des modèles quêtes
const Quest = require('./Quest');
const UserQuest = require('./UserQuest');

// Import des modèles achievements
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');

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

// Initialiser les nouveaux modèles (classes)
Attack.init(sequelize);
AttackWave.init(sequelize);
DefenseReport.init(sequelize);
SpyMission.init(sequelize);
TradeRoute.init(sequelize);
TradeConvoy.init(sequelize);
Portal.init(sequelize);
PortalExpedition.init(sequelize);

// Définir les associations pour les quêtes
Quest.hasMany(UserQuest, { foreignKey: 'quest_id', as: 'userQuests' });
UserQuest.belongsTo(Quest, { foreignKey: 'quest_id', as: 'quest' });
User.hasMany(UserQuest, { foreignKey: 'user_id', as: 'userQuests' });
UserQuest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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
  Blueprint,
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
  PortalExpedition,
  Quest,
  UserQuest,
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
  AllianceTreasuryLog,
  AllianceTerritory,
  AllianceWar,
  AllianceWarBattle
};

// Ajouter sequelize et Sequelize pour les associations
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;
