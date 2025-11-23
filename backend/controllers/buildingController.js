// backend/controllers/buildingController.js

const Building        = require('../models/Building');
const ResourceCost    = require('../models/ResourceCost');
const Resource        = require('../models/Resource');
const Entity          = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const { getBuildDurationSeconds } = require('../utils/balancing');

exports.getBuildingDetails = async (req, res) => {
  try {
    const b = await Building.findByPk(req.params.id);
    if (!b) return res.status(404).json({ message: 'Building not found' });

    let remainingTime = 0;
    if (b.build_start && b.build_duration) {
      const elapsed = (new Date() - new Date(b.build_start)) / 1000;
      const total   = Number(b.build_duration) || 0;

      if (elapsed < total) {
        remainingTime = Math.ceil(total - elapsed);
      } else {
        b.build_start    = null;
        b.build_duration = null;
        await b.save();
      }
    }

    res.json({
      ...b.toJSON(),
      remainingTime,
      inProgress: !!b.build_start && !!b.build_duration,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching building details' });
  }
};

exports.upgradeBuilding = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Pas de ville trouvée' });
    }

    const b = await Building.findByPk(req.params.id);
    if (!b) return res.status(404).json({ message: 'Building not found' });

    if (b.build_start && b.build_duration) {
      const elapsed = (new Date() - new Date(b.build_start)) / 1000;
      const total   = Number(b.build_duration) || 0;
      if (elapsed < total) {
        return res
          .status(400)
          .json({ message: 'Construction déjà en cours' });
      } else {
        b.build_start    = null;
        b.build_duration = null;
        await b.save();
      }
    }

    const entity = await Entity.findOne({
      where: {
        entity_type: 'building',
        entity_name: b.name,
      },
    });

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found for building' });
    }

    const nextLevel = (Number(b.level) || 0) + 1;

    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entity.entity_id,
        level: nextLevel,
      },
    });

    for (const cost of costs) {
      const ur = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
      });

      const currentAmount = ur ? Number(ur.amount) || 0 : 0;

      if (currentAmount < Number(cost.amount)) {
        return res
          .status(400)
          .json({ message: 'Ressources insuffisantes pour améliorer' });
      }
    }

    for (const cost of costs) {
      const ur = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
      });
      ur.amount = Number(ur.amount) - Number(cost.amount);
      await ur.save();
    }

    const buildDuration = getBuildDurationSeconds(nextLevel);
    b.build_start       = new Date();
    b.build_duration    = buildDuration;
    b.level             = nextLevel;
    await b.save();

    return res.json({
      buildDuration,
      inProgress: true,
      level: b.level,
      build_start: b.build_start,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error upgrading building' });
  }
};

exports.downgradeBuilding = async (req, res) => {
  try {
    const b = await Building.findByPk(req.params.id);
    if (!b) return res.status(404).json({ message: 'Building not found' });

    b.build_start    = null;
    b.build_duration = null;

    if (b.level > 1) b.level -= 1;
    await b.save();

    res.json(b);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error downgrading' });
  }
};
