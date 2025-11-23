// backend/controllers/facilityController.js

const Facility        = require('../models/Facility');
const ResourceCost    = require('../models/ResourceCost');
const Resource        = require('../models/Resource');
const Entity          = require('../models/Entity');
const { getUserMainCity } = require('../utils/cityUtils');

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
    console.error('Error fetching facility buildings:', error);
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
    console.error('Error fetching facility details:', error);
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

    res.json(facility);
  } catch (error) {
    console.error('Error upgrading facility:', error);
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
      res.json(facility);
    } else {
      res.status(400).json({ message: 'Cannot downgrade below level 0' });
    }
  } catch (error) {
    console.error('Error downgrading facility:', error);
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
    res.json({ message: 'Facility destroyed' });
  } catch (error) {
    console.error('Error destroying facility:', error);
    res.status(500).json({ message: 'Error destroying facility' });
  }
};
