const { Op } = require('sequelize');

const Resource = require('../models/Resource');
const Building = require('../models/Building');
const ResourceCost = require('../models/ResourceCost');
const Entity = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const {
  getProductionPerSecond,
  getBuildDurationSeconds,
} = require('../utils/balancing');

const RESOURCE_BUILDINGS = [
  "Mine d'or",
  'Mine de métal',
  'Extracteur',
  'Centrale électrique',
];

const TYPE_TO_BUILDING_NAME = {
  or: "Mine d'or",
  metal: 'Mine de métal',
  carburant: 'Extracteur',
};

async function getBuildingEntityId(building) {
  if (building.building_type_id) return building.building_type_id;

  const entity = await Entity.findOne({
    where: {
      entity_type: 'building',
      entity_name: building.name,
    },
  });

  if (!entity) {
    throw new Error(`Entity introuvable pour le bâtiment : ${building.name}`);
  }

  return entity.entity_id;
}

async function getResourceBuildings(userId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée pour ce joueur.');
    error.status = 404;
    throw error;
  }

  return Building.findAll({
    where: {
      city_id: city.id,
      name: {
        [Op.in]: RESOURCE_BUILDINGS,
      },
    },
    order: [['id', 'ASC']],
  });
}

async function getResourceBuildingDetails(userId, buildingId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const building = await Building.findOne({
    where: {
      id: buildingId,
      city_id: city.id,
    },
  });

  if (!building) {
    const error = new Error('Bâtiment introuvable.');
    error.status = 404;
    throw error;
  }

  let inProgress = false;
  let remainingTime = 0;

  if (building.build_start && building.build_duration) {
    const now = Date.now();
    const started = new Date(building.build_start).getTime();
    const elapsed = (now - started) / 1000;
    const total = Number(building.build_duration) || 0;

    if (elapsed < total) {
      inProgress = true;
      remainingTime = Math.ceil(total - elapsed);
    } else {
      building.build_start = null;
      building.build_duration = null;
      await building.save();
    }
  }

  const currentLevel = Number(building.level) || 0;
  const nextLevel = currentLevel + 1;

  const entityId = await getBuildingEntityId(building);

  const costs = await ResourceCost.findAll({
    where: {
      entity_id: entityId,
      level: nextLevel,
    },
    order: [['resource_type', 'ASC']],
  });

  const nextLevelCost = costs.map((c) => ({
    resource_type: c.resource_type,
    amount: Number(c.amount),
  }));

  const production_rate = getProductionPerSecond(building.name, currentLevel);
  const next_production_rate = getProductionPerSecond(building.name, nextLevel);
  const buildDuration = getBuildDurationSeconds(nextLevel);

  return {
    id: building.id,
    city_id: building.city_id,
    name: building.name,
    level: currentLevel,
    build_start: building.build_start,
    build_duration: building.build_duration,
    inProgress,
    remainingTime,
    production_rate,
    next_production_rate,
    buildDuration,
    nextLevelCost,
  };
}

async function upgradeResourceBuilding(userId, buildingId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const building = await Building.findOne({
    where: {
      id: buildingId,
      city_id: city.id,
    },
  });

  if (!building) {
    const error = new Error('Bâtiment introuvable.');
    error.status = 404;
    throw error;
  }

  if (building.build_start && building.build_duration) {
    const now = Date.now();
    const started = new Date(building.build_start).getTime();
    const elapsed = (now - started) / 1000;
    const total = Number(building.build_duration) || 0;

    if (elapsed < total) {
      const error = new Error('Construction déjà en cours pour ce bâtiment.');
      error.status = 400;
      throw error;
    } else {
      building.build_start = null;
      building.build_duration = null;
      await building.save();
    }
  }

  const currentLevel = Number(building.level) || 0;
  const nextLevel = currentLevel + 1;

  const entityId = await getBuildingEntityId(building);

  const costs = await ResourceCost.findAll({
    where: {
      entity_id: entityId,
      level: nextLevel,
    },
  });

  const resources = await Resource.findAll({
    where: { city_id: city.id },
  });

  const resMap = new Map(resources.map((r) => [r.type, r]));

  for (const cost of costs) {
    const resource = resMap.get(cost.resource_type);
    const currentAmount = resource ? Number(resource.amount) || 0 : 0;

    if (currentAmount < Number(cost.amount)) {
      const error = new Error(`Ressources insuffisantes pour améliorer : ${building.name}.`);
      error.status = 400;
      throw error;
    }
  }

  for (const cost of costs) {
    const resource = resMap.get(cost.resource_type);
    resource.amount = Number(resource.amount) - Number(cost.amount);
    await resource.save();
  }

  const buildDuration = getBuildDurationSeconds(nextLevel);

  building.level = nextLevel;
  building.build_start = new Date();
  building.build_duration = buildDuration;
  await building.save();

  return {
    message: 'Bâtiment amélioré.',
    id: building.id,
    name: building.name,
    level: building.level,
    build_start: building.build_start,
    build_duration: building.build_duration,
    buildDuration,
  };
}

async function downgradeResourceBuilding(userId, buildingId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const building = await Building.findOne({
    where: {
      id: buildingId,
      city_id: city.id,
    },
  });

  if (!building) {
    const error = new Error('Bâtiment introuvable.');
    error.status = 404;
    throw error;
  }

  building.build_start = null;
  building.build_duration = null;

  if (building.level > 0) {
    building.level -= 1;
  }

  await building.save();
  return building;
}

async function destroyResourceBuilding(userId, buildingId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const building = await Building.findOne({
    where: {
      id: buildingId,
      city_id: city.id,
    },
  });

  if (!building) {
    const error = new Error('Bâtiment introuvable.');
    error.status = 404;
    throw error;
  }

  await building.destroy();
  return { message: 'Bâtiment détruit.' };
}

async function getUserResources(userId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const resources = await Resource.findAll({
    where: { city_id: city.id },
  });

  const buildings = await Building.findAll({
    where: { city_id: city.id },
  });

  const buildingKey = (cityId, name) => `${cityId}::${name}`;
  const buildingMap = new Map();

  buildings.forEach((b) => {
    buildingMap.set(buildingKey(b.city_id, b.name), b);
  });

  const now = new Date();
  const results = [];
  const updates = [];

  for (const resource of resources) {
    const type = resource.type;

    const prodBuildingName = TYPE_TO_BUILDING_NAME[type];
    const bKey = prodBuildingName ? buildingKey(resource.city_id, prodBuildingName) : null;
    const building = bKey ? buildingMap.get(bKey) : null;

    const lastUpdate = resource.last_update ? new Date(resource.last_update) : now;
    const diffSec = Math.max(0, (now - lastUpdate) / 1000);

    let amount = Number(resource.amount) || 0;
    let rate = 0;

    if (building) {
      rate = getProductionPerSecond(building.name, building.level);
      if (diffSec > 0) {
        const produced = rate * diffSec;
        amount += produced;
      }
    }

    const roundedAmount = Math.floor(amount);

    updates.push({
      id: resource.id,
      amount: roundedAmount,
      last_update: now,
    });

    results.push({
      id: resource.id,
      city_id: resource.city_id,
      type: resource.type,
      amount: roundedAmount,
      last_update: now,
      level: building ? Number(building.level) || 0 : 0,
      production_rate: rate,
    });
  }

  for (const update of updates) {
    await Resource.update(
      {
        amount: update.amount,
        last_update: update.last_update,
      },
      {
        where: { id: update.id },
      }
    );
  }

  return results;
}

async function saveUserResources(userId, resourcesPayload) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Aucune ville trouvée.');
    error.status = 404;
    throw error;
  }

  const payload = Array.isArray(resourcesPayload) ? resourcesPayload : [];

  for (const resource of payload) {
    if (!resource.type) continue;

    await Resource.update(
      {
        amount: Number(resource.amount) || 0,
        last_update: new Date(),
      },
      {
        where: {
          city_id: city.id,
          type: resource.type,
        },
      }
    );
  }

  return { message: 'Ressources sauvegardées (backend maître).' };
}

module.exports = {
  getResourceBuildings,
  getResourceBuildingDetails,
  upgradeResourceBuilding,
  downgradeResourceBuilding,
  destroyResourceBuilding,
  getUserResources,
  saveUserResources,
};