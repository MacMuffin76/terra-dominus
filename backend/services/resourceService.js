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
const sequelize = require('../db');

const RESOURCE_BUILDINGS = [
  "Mine d'or",
  'Mine de métal',
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

const MAX_BUILDING_UPDATE_RETRIES = 2;

function assertOptimisticUpdate(updatedRows) {
  if (!updatedRows) {
    const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
    error.status = 409;
    throw error;
  }
}

async function getBuildingEntityId(building, options = {}) {
  if (building.building_type_id) return building.building_type_id;

  const entity = await Entity.findOne({
    where: {
      entity_type: 'building',
      entity_name: building.name,
    },
    ...options,
  });

  if (!entity) {
    throw new Error(`Entity introuvable pour le bâtiment : ${building.name}`);
  }

  return entity.entity_id;
}

async function reloadBuildingWithLock(cityId, buildingId, transaction) {
  return Building.findOne({
    where: { id: buildingId, city_id: cityId },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
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
  for (let attempt = 1; attempt <= MAX_BUILDING_UPDATE_RETRIES; attempt++) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!city) {
          const error = new Error('Aucune ville trouvée.');
          error.status = 404;
          throw error;
        }

        let building = await reloadBuildingWithLock(city.id, buildingId, transaction);

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
            const currentVersion = Number(building.version) || 0;
            const [affected] = await Building.update(
              {
                build_start: null,
                build_duration: null,
                version: currentVersion + 1,
              },
              {
                where: { id: building.id, version: currentVersion },
                transaction,
              }
            );
            assertOptimisticUpdate(affected);
            building = await reloadBuildingWithLock(city.id, buildingId, transaction);
          }
        }

        const currentLevel = Number(building.level) || 0;
        const nextLevel = currentLevel + 1;

        const entityId = await getBuildingEntityId(building, { transaction });

        const costs = await ResourceCost.findAll({
          where: {
            entity_id: entityId,
            level: nextLevel,
          },
          transaction,
        });

        const resources = await Resource.findAll({
          where: { city_id: city.id },
          transaction,
          lock: transaction.LOCK.UPDATE,
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
          const currentAmount = Number(resource.amount);
          const updatedAmount = currentAmount - Number(cost.amount);
          const currentVersion = Number(resource.version) || 0;

          const [affected] = await Resource.update(
            {
              amount: updatedAmount,
              version: currentVersion + 1,
            },
            {
              where: { id: resource.id, version: currentVersion },
              transaction,
            }
          );

          assertOptimisticUpdate(affected);
          resource.amount = updatedAmount;
          resource.version = currentVersion + 1;
        }

        const buildDuration = getBuildDurationSeconds(nextLevel);
        const currentVersion = Number(building.version) || 0;
        const build_start = new Date();

        const [affected, updatedBuildings] = await Building.update(
          {
            level: nextLevel,
            build_start,
            build_duration: buildDuration,
            version: currentVersion + 1,
          },
          {
            where: { id: building.id, version: currentVersion },
            transaction,
            returning: true,
          }
        );

        assertOptimisticUpdate(affected);
        const updatedBuilding = updatedBuildings?.[0] || (await reloadBuildingWithLock(city.id, buildingId, transaction));

        return {
          message: 'Bâtiment amélioré.',
          id: updatedBuilding.id,
          name: updatedBuilding.name,
          level: Number(updatedBuilding.level) || nextLevel,
          build_start: updatedBuilding.build_start,
          build_duration: updatedBuilding.build_duration,
          buildDuration,
        };
      });
    } catch (err) {
      if (err.status === 409 && attempt < MAX_BUILDING_UPDATE_RETRIES) {
        continue;
      }
      throw err;
    }
  }
}

async function downgradeResourceBuilding(userId, buildingId) {
  return sequelize.transaction(async (transaction) => {
    const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
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
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

  if (!building) {
      const error = new Error('Bâtiment introuvable.');
      error.status = 404;
      throw error;
    }

  const nextLevel = building.level > 0 ? building.level - 1 : building.level;
    const currentVersion = Number(building.version) || 0;

  const [affected] = await Building.update(
      {
        build_start: null,
        build_duration: null,
        level: nextLevel,
        version: currentVersion + 1,
      },
      {
        where: { id: building.id, version: currentVersion },
        transaction,
      }
    );
     assertOptimisticUpdate(affected);
    return {
      ...building.toJSON(),
      level: nextLevel,
      build_start: null,
      build_duration: null,
      version: currentVersion + 1,
    };
  });
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

function getAllowedResourceBuildingNames() {
  return [...RESOURCE_BUILDINGS];
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