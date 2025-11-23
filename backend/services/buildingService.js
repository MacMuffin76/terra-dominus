const Building = require('../models/Building');
const ResourceCost = require('../models/ResourceCost');
const Resource = require('../models/Resource');
const Entity = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const { getBuildDurationSeconds } = require('../utils/balancing');

function ensureBuildAvailability(building) {
  if (building.build_start && building.build_duration) {
    const elapsed = (new Date() - new Date(building.build_start)) / 1000;
    const total = Number(building.build_duration) || 0;

    if (elapsed < total) {
      const error = new Error('Construction déjà en cours');
      error.status = 400;
      throw error;
    }

    building.build_start = null;
    building.build_duration = null;
  }
}

async function getBuildingDetails(buildingId) {
  const building = await Building.findByPk(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = 404;
    throw error;
  }

  let remainingTime = 0;
  if (building.build_start && building.build_duration) {
    const elapsed = (new Date() - new Date(building.build_start)) / 1000;
    const total = Number(building.build_duration) || 0;

    if (elapsed < total) {
      remainingTime = Math.ceil(total - elapsed);
    } else {
      building.build_start = null;
      building.build_duration = null;
      await building.save();
    }
  }

  return {
    ...building.toJSON(),
    remainingTime,
    inProgress: !!building.build_start && !!building.build_duration,
  };
}

async function upgradeBuilding(userId, buildingId) {
  const city = await getUserMainCity(userId);
  if (!city) {
    const error = new Error('Pas de ville trouvée');
    error.status = 404;
    throw error;
  }

  const building = await Building.findByPk(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = 404;
    throw error;
  }

  ensureBuildAvailability(building);

  const entity = await Entity.findOne({
    where: {
      entity_type: 'building',
      entity_name: building.name,
    },
  });

  if (!entity) {
    const error = new Error('Entity not found for building');
    error.status = 404;
    throw error;
  }

  const nextLevel = (Number(building.level) || 0) + 1;

  const costs = await ResourceCost.findAll({
    where: {
      entity_id: entity.entity_id,
      level: nextLevel,
    },
  });

  for (const cost of costs) {
    const userResource = await Resource.findOne({
      where: { city_id: city.id, type: cost.resource_type },
    });

    const currentAmount = userResource ? Number(userResource.amount) || 0 : 0;

    if (currentAmount < Number(cost.amount)) {
      const error = new Error('Ressources insuffisantes pour améliorer');
      error.status = 400;
      throw error;
    }
  }

  for (const cost of costs) {
    const userResource = await Resource.findOne({
      where: { city_id: city.id, type: cost.resource_type },
    });
    userResource.amount = Number(userResource.amount) - Number(cost.amount);
    await userResource.save();
  }

  const buildDuration = getBuildDurationSeconds(nextLevel);
  building.build_start = new Date();
  building.build_duration = buildDuration;
  building.level = nextLevel;
  await building.save();

  return {
    buildDuration,
    inProgress: true,
    level: building.level,
    build_start: building.build_start,
  };
}

async function downgradeBuilding(buildingId) {
  const building = await Building.findByPk(buildingId);
  if (!building) {
    const error = new Error('Building not found');
    error.status = 404;
    throw error;
  }

  building.build_start = null;
  building.build_duration = null;

  if (building.level > 1) {
    building.level -= 1;
  }
  await building.save();

  return building;
}

module.exports = {
  getBuildingDetails,
  upgradeBuilding,
  downgradeBuilding,
};