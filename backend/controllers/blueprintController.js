const createBlueprintController = ({ blueprintRepository }) => {
  const listBlueprints = async (req, res) => {
    try {
      const { category } = req.query;
      const blueprints = await blueprintRepository.listByCategory(category);
      return res.json(blueprints);
    } catch (error) {
      console.error('Error fetching blueprints:', error);
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

      return res.json(updated);
    } catch (error) {
      console.error('Error updating blueprint:', error);
      return res.status(500).json({ message: 'Error updating blueprint' });
    }
  };

  return { listBlueprints, updateBlueprint };
};

module.exports = createBlueprintController;