const ResourceCost = require('../models/ResourceCost');

// Get costs for a specific entity and level
exports.getEntityCosts = async (req, res) => {
  try {
    const { entityId, level } = req.params;
    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entityId,
        level: level,
      },
    });
    res.json(costs);
  } catch (error) {
    console.error('Error fetching entity costs:', error);
    res.status(500).json({ message: 'Error fetching entity costs' });
  }
};

// Add costs for a specific entity
exports.addEntityCosts = async (req, res) => {
  try {
    const { entityId, costs } = req.body;
    for (const cost of costs) {
      await ResourceCost.create({
        entity_id: entityId,
        resource_type: cost.resource_type,
        amount: cost.amount,
        level: cost.level,
      });
    }
    res.status(201).json({ message: 'Costs added successfully' });
  } catch (error) {
    console.error('Error adding entity costs:', error);
    res.status(500).json({ message: 'Error adding entity costs' });
  }
};
