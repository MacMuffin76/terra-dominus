const Building = require('../models/Building');
const ResourceCost = require('../models/ResourceCost');
const Entity = require('../models/Entity');

// Create a new building
exports.createBuilding = async (req, res) => {
  try {
    const { name, level, costs } = req.body;
    const building = await Building.create({ name, level });

    // Add entity entry
    const entity = await Entity.create({ entity_type: 'building', entity_name: name });

    // Add costs
    for (const cost of costs) {
      await ResourceCost.create({
        entity_id: entity.entity_id,
        resource_type: cost.resource_type,
        amount: cost.amount,
        level: cost.level,
      });
    }

    res.json(building);
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({ message: 'Error creating building' });
  }
};

// Get building costs by level
exports.getBuildingCosts = async (req, res) => {
  try {
    const { buildingId, level } = req.params;
    const building = await Building.findByPk(buildingId);

    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    const entity = await Entity.findOne({
      where: { entity_type: 'building', entity_name: building.name }
    });

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entity.entity_id,
        level: level,
      },
    });

    res.json(costs);
  } catch (error) {
    console.error('Error fetching building costs:', error);
    res.status(500).json({ message: 'Error fetching building costs' });
  }
};

// Upgrade a specific building
exports.upgradeBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    building.level += 1;
    await building.save();
    res.json(building);
  } catch (error) {
    console.error('Error upgrading building:', error);
    res.status(500).json({ message: 'Error upgrading building' });
  }
};

// Destroy a specific building
exports.destroyBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }
    await building.destroy();
    res.json({ message: 'Building destroyed' });
  } catch (error) {
    console.error('Error destroying building:', error);
    res.status(500).json({ message: 'Error destroying building' });
  }
};
