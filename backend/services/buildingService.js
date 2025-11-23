const Building = require('../models/Building');
const ResourceCost = require('../models/ResourceCost');
const Resource = require('../models/Resource');
const Entity = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const { getBuildDurationSeconds } = require('../utils/balancing');
const sequelize = require('../db');

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

function assertOptimisticUpdate(updatedRows) {
  if (!updatedRows) {
    const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
    error.status = 409;
    throw error;
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
    return sequelize.transaction(async (transaction) => {
    const city = await getUserMainCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!city) {
      const error = new Error('Pas de ville trouvée');
      error.status = 404;
      throw error;
    }

    const building = await Building.findByPk(buildingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!building || building.city_id !== city.id) {
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
      transaction,
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
      transaction,
    });

    for (const cost of costs) {
      const userResource = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
        transaction,
        lock: transaction.LOCK.UPDATE,
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
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const currentAmount = Number(userResource.amount);
      const updatedAmount = currentAmount - Number(cost.amount);
      const currentVersion = Number(userResource.version) || 0;

      const [affected] = await Resource.update(
        {
          amount: updatedAmount,
          version: currentVersion + 1,
        },
        {
          where: { id: userResource.id, version: currentVersion },
          transaction,
        }
      );

      assertOptimisticUpdate(affected);
      userResource.amount = updatedAmount;
      userResource.version = currentVersion + 1;
    }

    const buildDuration = getBuildDurationSeconds(nextLevel);
    const build_start = new Date();
    const currentVersion = Number(building.version) || 0;

    const [affected] = await Building.update(
      {
        build_start,
        build_duration: buildDuration,
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
      buildDuration,
      inProgress: true,
      level: nextLevel,
      build_start,
    };
  });
}

async function downgradeBuilding(buildingId) {
  return sequelize.transaction(async (transaction) => {
    const building = await Building.findByPk(buildingId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!building) {
      const error = new Error('Building not found');
      error.status = 404;
      throw error;
    }

    const nextLevel = building.level > 1 ? building.level - 1 : building.level;
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

module.exports = {
  getBuildingDetails,
  upgradeBuilding,
  downgradeBuilding,
};