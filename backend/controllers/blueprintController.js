const { getLogger } = require('../utils/logger');

const createBlueprintController = ({ blueprintRepository }) => {
  const logger = getLogger({ module: 'BlueprintController' });

  const listBlueprints = async (req, res) => {
    try {
      const { category } = req.query;
      const blueprints = await blueprintRepository.listByCategory(category);
      return res.json(blueprints);
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error fetching blueprints');
      return res.status(500).json({ message: 'Error fetching blueprints' });
    }
  };

  const updateBlueprint = async (req, res) => {
    try {
      const blueprintId = req.params.id;
      const { max_level, base_duration_seconds, costs } = req.body;

      const parsedCosts = typeof costs === 'string' ? JSON.parse(costs) : costs;

      const updated = await blueprintRepository.updateBlueprint(
        blueprintId,
        { max_level, base_duration_seconds, costs: parsedCosts },
        req.user?.id,
      );

      if (!updated) {
        return res.status(404).json({ message: 'Blueprint not found' });
      }

      (req.logger || logger).audit({ blueprintId, userId: req.user?.id }, 'Blueprint updated');
      return res.json(updated);
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error updating blueprint');
      return res.status(500).json({ message: 'Error updating blueprint' });
    }
  };

  return { listBlueprints, updateBlueprint };
};

module.exports = createBlueprintController;