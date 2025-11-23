// backend/controllers/resourceController.js

const { Op } = require('sequelize');
const sequelize = require('../db');

const Resource      = require('../models/Resource');
const Building      = require('../models/Building');
const ResourceCost  = require('../models/ResourceCost');
const Entity        = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const {
  getProductionPerSecond,
  getBuildDurationSeconds,
} = require('../utils/balancing');

// Bâtiments de ressources pris en compte dans l’onglet "Ressources"
const RESOURCE_BUILDINGS = [
  "Mine d'or",
  'Mine de métal',
  'Extracteur',
  'Centrale électrique',
];

// Mapping type de ressource -> nom de bâtiment producteur
// ⚠ IMPORTANT : on NE mappe PAS 'energie' pour que l'énergie
// ne soit PAS produite automatiquement par seconde.
const TYPE_TO_BUILDING_NAME = {
  or: "Mine d'or",
  metal: 'Mine de métal',
  carburant: 'Extracteur',
  // energie: 'Centrale électrique', // volontairement ignoré
};

// Utilitaire : récupérer entity_id du building
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

/**
 * GET /resources/resource-buildings
 * Retourne les bâtiments de ressource de la ville principale du joueur.
 */
exports.getResourceBuildings = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée pour ce joueur.' });
    }

    const buildings = await Building.findAll({
      where: {
        city_id: city.id,
        name: {
          [Op.in]: RESOURCE_BUILDINGS,
        },
      },
      order: [['id', 'ASC']],
    });

    return res.json(buildings);
  } catch (err) {
    console.error('Error fetching resource buildings:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des bâtiments de ressource.' });
  }
};

/**
 * GET /resources/resource-buildings/:id
 * Détails d’un bâtiment de ressource.
 */
exports.getBuildingDetails = async (req, res) => {
  try {
    const userId     = req.user.id;
    const buildingId = req.params.id;

    const city = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
    }

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      return res.status(404).json({ message: 'Bâtiment introuvable.' });
    }

    let inProgress    = false;
    let remainingTime = 0;

    if (building.build_start && building.build_duration) {
      const now       = Date.now();
      const started   = new Date(building.build_start).getTime();
      const elapsed   = (now - started) / 1000; // secondes
      const total     = Number(building.build_duration) || 0;

      if (elapsed < total) {
        inProgress    = true;
        remainingTime = Math.ceil(total - elapsed);
      } else {
        building.build_start    = null;
        building.build_duration = null;
        await building.save();
      }
    }

    const currentLevel = Number(building.level) || 0;
    const nextLevel    = currentLevel + 1;

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

    const production_rate      = getProductionPerSecond(building.name, currentLevel);
    const next_production_rate = getProductionPerSecond(building.name, nextLevel);
    const buildDuration        = getBuildDurationSeconds(nextLevel);

    return res.json({
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
    });
  } catch (err) {
    console.error('Error fetching building details:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la récupération du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/upgrade
 */
exports.upgradeBuilding = async (req, res) => {
  try {
    const userId     = req.user.id;
    const buildingId = req.params.id;

    const city = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
    }

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      return res.status(404).json({ message: 'Bâtiment introuvable.' });
    }

    if (building.build_start && building.build_duration) {
      const now       = Date.now();
      const started   = new Date(building.build_start).getTime();
      const elapsed   = (now - started) / 1000;
      const total     = Number(building.build_duration) || 0;

      if (elapsed < total) {
        return res
          .status(400)
          .json({ message: 'Construction déjà en cours pour ce bâtiment.' });
      } else {
        building.build_start    = null;
        building.build_duration = null;
        await building.save();
      }
    }

    const currentLevel = Number(building.level) || 0;
    const nextLevel    = currentLevel + 1;

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
      const r = resMap.get(cost.resource_type);
      const currentAmount = r ? Number(r.amount) || 0 : 0;

      if (currentAmount < Number(cost.amount)) {
        return res.status(400).json({
          message: `Ressources insuffisantes pour améliorer : ${building.name}.`,
        });
      }
    }

    for (const cost of costs) {
      const r = resMap.get(cost.resource_type);
      r.amount = Number(r.amount) - Number(cost.amount);
      await r.save();
    }

    const buildDuration = getBuildDurationSeconds(nextLevel);

    building.level          = nextLevel;
    building.build_start    = new Date();
    building.build_duration = buildDuration;
    await building.save();

    return res.json({
      message: 'Bâtiment amélioré.',
      id: building.id,
      name: building.name,
      level: building.level,
      build_start: building.build_start,
      build_duration: building.build_duration,
      buildDuration,
    });
  } catch (err) {
    console.error('Error upgrading building:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de l’amélioration du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/downgrade
 */
exports.downgradeBuilding = async (req, res) => {
  try {
    const userId     = req.user.id;
    const buildingId = req.params.id;

    const city = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
    }

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      return res.status(404).json({ message: 'Bâtiment introuvable.' });
    }

    building.build_start    = null;
    building.build_duration = null;

    if (building.level > 0) {
      building.level -= 1;
    }

    await building.save();

    return res.json(building);
  } catch (err) {
    console.error('Erreur downgrade:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors du rétrogradage du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/destroy
 */
exports.destroyBuilding = async (req, res) => {
  try {
    const userId     = req.user.id;
    const buildingId = req.params.id;

    const city = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
    }

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      return res.status(404).json({ message: 'Bâtiment introuvable.' });
    }

    await building.destroy();

    return res.json({ message: 'Bâtiment détruit.' });
  } catch (err) {
    console.error('Error destroying building:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la destruction du bâtiment.' });
  }
};

/**
 * GET /resources/user-resources
 *
 * - Recalcule les ressources en fonction du temps écoulé depuis last_update
 *   (offline income).
 * - Renvoie aussi le taux de production (production_rate) pour que le front
 *   puisse incrémenter visuellement chaque seconde.
 */
exports.getUserResources = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
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

    const now      = new Date();
    const results  = [];
    const updates  = [];

    for (const r of resources) {
      const type = r.type;

      const prodBuildingName = TYPE_TO_BUILDING_NAME[type];
      const bKey             = prodBuildingName ? buildingKey(r.city_id, prodBuildingName) : null;
      const building         = bKey ? buildingMap.get(bKey) : null;

      const lastUpdate = r.last_update ? new Date(r.last_update) : now;
      const diffSec    = Math.max(0, (now - lastUpdate) / 1000);

      let amount = Number(r.amount) || 0;
      let rate   = 0;

      // On ne produit QUE pour or, métal, carburant
      if (building) {
        rate = getProductionPerSecond(building.name, building.level);
        if (diffSec > 0) {
          const produced = rate * diffSec;
          amount += produced;
        }
      }

      const roundedAmount = Math.floor(amount);

      updates.push({
        id: r.id,
        amount: roundedAmount,
        last_update: now,
      });

      results.push({
        id: r.id,
        city_id: r.city_id,
        type: r.type,
        amount: roundedAmount,
        last_update: now,
        level: building ? Number(building.level) || 0 : 0,
        production_rate: rate, // 🔹 très important pour le front
      });
    }

    for (const u of updates) {
      await Resource.update(
        {
          amount: u.amount,
          last_update: u.last_update,
        },
        {
          where: { id: u.id },
        }
      );
    }

    return res.json(results);
  } catch (err) {
    console.error('Error fetching user resources:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des ressources.' });
  }
};

/**
 * POST /resources/save
 */
exports.saveUserResources = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée.' });
    }

    const payload = Array.isArray(req.body.resources)
      ? req.body.resources
      : [];

    for (const r of payload) {
      if (!r.type) continue;

      await Resource.update(
        {
          amount: Number(r.amount) || 0,
          last_update: new Date(),
        },
        {
          where: {
            city_id: city.id,
            type: r.type,
          },
        }
      );
    }

    return res.json({ message: 'Ressources sauvegardées (backend maître).' });
  } catch (err) {
    console.error('Error saving resources:', err);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la sauvegarde des ressources.' });
  }
};
