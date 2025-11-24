const ResourceCost = require('../models/ResourceCost');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'CostController' });

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
    (req.logger || logger).error({ err: error }, 'Error fetching entity costs');
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
    (req.logger || logger).audit({ entityId, count: costs.length }, 'Entity costs added');
    res.status(201).json({ message: 'Costs added successfully' });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error adding entity costs');
    res.status(500).json({ message: 'Error adding entity costs' });
  }
};