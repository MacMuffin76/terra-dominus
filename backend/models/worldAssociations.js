/**
 * Associations Sequelize pour le système World
 * À inclure après la définition de tous les modèles
 */

const WorldGrid = require('./WorldGrid');
const CitySlot = require('./CitySlot');
const City = require('./City');
const ColonizationMission = require('./ColonizationMission');
const ExploredTile = require('./ExploredTile');
const User = require('./User');

// WorldGrid <-> CitySlot
WorldGrid.hasMany(CitySlot, {
  foreignKey: 'grid_id',
  as: 'citySlots',
});

CitySlot.belongsTo(WorldGrid, {
  foreignKey: 'grid_id',
  as: 'grid',
});

// CitySlot <-> City
CitySlot.belongsTo(City, {
  foreignKey: 'city_id',
  as: 'city',
});

City.hasOne(CitySlot, {
  foreignKey: 'city_id',
  as: 'slot',
});

// ExploredTile <-> User
ExploredTile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(ExploredTile, {
  foreignKey: 'user_id',
  as: 'exploredTiles',
});

// ExploredTile <-> WorldGrid
ExploredTile.belongsTo(WorldGrid, {
  foreignKey: 'grid_id',
  as: 'tile',
});

WorldGrid.hasMany(ExploredTile, {
  foreignKey: 'grid_id',
  as: 'explorations',
});

// ColonizationMission <-> User
ColonizationMission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(ColonizationMission, {
  foreignKey: 'user_id',
  as: 'colonizationMissions',
});

// ColonizationMission <-> City (departure)
ColonizationMission.belongsTo(City, {
  foreignKey: 'departure_city_id',
  as: 'departureCity',
});

City.hasMany(ColonizationMission, {
  foreignKey: 'departure_city_id',
  as: 'departureMissions',
});

// ColonizationMission <-> CitySlot (target)
ColonizationMission.belongsTo(CitySlot, {
  foreignKey: 'target_slot_id',
  as: 'targetSlot',
});

CitySlot.hasMany(ColonizationMission, {
  foreignKey: 'target_slot_id',
  as: 'missions',
});

module.exports = {
  WorldGrid,
  CitySlot,
  City,
  ColonizationMission,
  ExploredTile,
  User,
};
