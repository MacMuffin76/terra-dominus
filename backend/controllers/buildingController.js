// backend/controllers/buildingController.js

const createBuildingController = ({ buildingService }) => {
  const getBuildingDetails = async (req, res) => {
    try {
      const details = await buildingService.getBuildingDetails(req.params.id);
      res.json(details);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error fetching building details' });
    }
  };

  const upgradeBuilding = async (req, res) => {
    try {
      const result = await buildingService.upgradeBuilding(req.user.id, req.params.id);
      return res.json(result);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error upgrading building' });
    }
  };

  const downgradeBuilding = async (req, res) => {
    try {
      res.status(410).json({ message: 'Downgrade not supported with construction queue' });
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error downgrading' });
    }
  };

  const listConstructionQueue = async (req, res) => {
    try {
      const queue = await buildingService.listConstructionQueue(req.user.id);
      res.json(queue);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error fetching construction queue' });
    }
  };

  const cancelConstruction = async (req, res) => {
    try {
      const result = await buildingService.cancelConstruction(req.user.id, req.params.id);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error cancelling construction' });
    }
  };

  const accelerateConstruction = async (req, res) => {
    try {
      const result = await buildingService.accelerateConstruction(req.user.id, req.params.id);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error accelerating construction' });
    }
  };

  return {
    getBuildingDetails,
    upgradeBuilding,
    downgradeBuilding,
    listConstructionQueue,
    cancelConstruction,
    accelerateConstruction,
  };
};

module.exports = createBuildingController;