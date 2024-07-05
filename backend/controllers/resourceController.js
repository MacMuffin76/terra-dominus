const Building = require('../models/Building');
const Resource = require('../models/Resource');
const ResourceProduction = require('../models/ResourceProduction'); // Assurez-vous d'avoir ce modèle

exports.getResourceBuildings = async (req, res) => {
  try {
    const buildings = await Building.findAll({ where: { user_id: req.user.id } });
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching resource buildings:', error);
    res.status(500).json({ message: 'Error fetching resource buildings' });
  }
};

exports.getBuildingDetails = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    res.json({
      ...building.dataValues,
      description: building.description,
      nextLevelCost: 'Coût du prochain niveau...',
    });
  } catch (error) {
    console.error('Error fetching building details:', error);
    res.status(500).json({ message: 'Error fetching building details' });
  }
};

exports.upgradeBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    building.level += 1;
    await building.save();
    res.json(building);
  } catch (error) {
    console.error('Error upgrading building:', error);
    res.status(500).json({ message: 'Error upgrading building' });
  }
};

exports.getUserResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({ where: { user_id: req.user.id } });
    res.json(resources);
  } catch (error) {
    console.error('Error fetching user resources:', error);
    res.status(500).json({ message: 'Error fetching user resources' });
  }
};

exports.destroyBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    await building.destroy();
    res.json({ message: 'Building destroyed' });
  } catch (error) {
    console.error('Error destroying building:', error);
    res.status(500).json({ message: 'Error destroying building' });
  }
};

exports.updateUserResources = async (userId) => {
  try {
    // Récupérer les bâtiments de l'utilisateur
    const buildings = await Building.findAll({ where: { user_id: userId } });

    // Calculer la production de ressources
    let resourceUpdates = {};

    for (const building of buildings) {
      const productions = await ResourceProduction.findAll({ where: { building_id: building.id, level: building.level } });
      for (const production of productions) {
        if (!resourceUpdates[production.resource_type_id]) {
          resourceUpdates[production.resource_type_id] = 0;
        }
        resourceUpdates[production.resource_type_id] += production.production_rate;
      }
    }

    // Mettre à jour les ressources de l'utilisateur
    for (const [resourceTypeId, amount] of Object.entries(resourceUpdates)) {
      const resource = await Resource.findOne({ where: { user_id: userId, resource_type_id: resourceTypeId } });
      if (resource) {
        resource.amount += amount;
        await resource.save();
      }
    }
  } catch (error) {
    console.error('Error updating user resources:', error);
  }
};