// backend/controllers/facilityController.js

const Facility        = require('../models/Facility');
const ResourceCost    = require('../models/ResourceCost');
const Resource        = require('../models/Resource');
const Entity          = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'FacilityController' });

// Récupère toutes les installations de la ville principale
exports.getFacilityBuildings = async (req, res) => {
  try {
    const city = await getUserMainCity(req.user.id);
    if (!city) {
      return res.status(404).json({ message: 'Pas de ville trouvée' });
    }

  const facilities = await Facility.findAll({
    where: { city_id: city.id },
  });

  res.json(facilities);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching facility buildings');
    res.status(500).json({ message: 'Error fetching facility buildings' });
  }
};

// Détails d’une installation + coût du niveau suivant
exports.getFacilityDetails = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const entity = await Entity.findOne({
      where: { entity_type: 'facility', entity_name: facility.name },
    });
    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    const nextLevelCost = await ResourceCost.findAll({
      where: {
        entity_id: entity.entity_id,
        level:     facility.level + 1,
      },
    });

    res.json({
      ...facility.dataValues,
      nextLevelCost,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching facility details');
    res.status(500).json({ message: 'Error fetching facility details' });
  }
};

// Upgrade facility (déduit ressources de la ville)
exports.upgradeFacility = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);
    if (!city) {
      return res.status(404).json({ message: 'Pas de ville trouvée' });
    }

    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const entity = await Entity.findOne({
      where: { entity_type: 'facility', entity_name: facility.name },
    });
    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entity.entity_id,
        level:     facility.level + 1,
      },
    });

    for (const cost of costs) {
      const userRes = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
      });
      if (!userRes || userRes.amount < cost.amount) {
        return res
          .status(400)
          .json({ message: `Pas assez de ${cost.resource_type}` });
      }
    }

    for (const cost of costs) {
      const userRes = await Resource.findOne({
        where: { city_id: city.id, type: cost.resource_type },
      });
      userRes.amount -= cost.amount;
      await userRes.save();
    }

    facility.level += 1;
    await facility.save();

    (req.logger || logger).audit({ userId, facilityId: facility.id }, 'Facility upgraded');
    res.json(facility);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error upgrading facility');
    res.status(500).json({ message: 'Error upgrading facility' });
  }
};

exports.downgradeFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    if (facility.level > 0) {
      facility.level -= 1;
      await facility.save();
      (req.logger || logger).audit({ facilityId: facility.id, userId: req.user.id }, 'Facility downgraded');
      res.json(facility);
    } else {
      res.status(400).json({ message: 'Cannot downgrade below level 0' });
    }
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error downgrading facility');
    res.status(500).json({ message: 'Error downgrading facility' });
  }
};

exports.destroyFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    await facility.destroy();
    (req.logger || logger).audit({ facilityId: facility.id, userId: req.user.id }, 'Facility destroyed');
    res.json({ message: 'Facility destroyed' });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error destroying facility');
    res.status(500).json({ message: 'Error destroying facility' });
  }
};