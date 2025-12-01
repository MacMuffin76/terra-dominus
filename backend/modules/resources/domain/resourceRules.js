const RESOURCE_BUILDINGS = [
  'Mine de métal',
  "Mine d'or",
  'Extracteur',
  'Centrale électrique',
  'Hangar',
  'Réservoir',
];

const TYPE_TO_BUILDING_NAME = {
  or: "Mine d'or",
  metal: 'Mine de métal',
  carburant: 'Extracteur',
};

const STORAGE_BASE_CAPACITY = {
  or: 5000,
  metal: 5000,
  carburant: 3000,
  energie: 1000,
};

const STORAGE_GROWTH = {
  hangar: 1.25,
  reservoir: 1.25,
  centrale: 1.15,
};

const ENERGY_CONSUMPTION_PER_LEVEL = 2;

const calculateStorageCapacities = ({ hangarLevel = 0, reservoirLevel = 0, centraleLevel = 0 }) => ({
  or: Math.floor(STORAGE_BASE_CAPACITY.or * Math.pow(STORAGE_GROWTH.hangar, hangarLevel)),
  metal: Math.floor(STORAGE_BASE_CAPACITY.metal * Math.pow(STORAGE_GROWTH.hangar, hangarLevel)),
  carburant: Math.floor(STORAGE_BASE_CAPACITY.carburant * Math.pow(STORAGE_GROWTH.reservoir, reservoirLevel)),
  energie: Math.floor(STORAGE_BASE_CAPACITY.energie * Math.pow(STORAGE_GROWTH.centrale, Math.max(1, centraleLevel))),
});

module.exports = {
  RESOURCE_BUILDINGS,
  TYPE_TO_BUILDING_NAME,
  STORAGE_BASE_CAPACITY,
  STORAGE_GROWTH,
  ENERGY_CONSUMPTION_PER_LEVEL,
  calculateStorageCapacities,
};