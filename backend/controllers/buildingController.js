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

  const startUpgrade = async (req, res) => {
    try {
      const result = await buildingService.startUpgrade(req.user.id, req.params.id);
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

  const collectConstruction = async (req, res) => {
    try {
      const result = await buildingService.collectConstruction(req.user.id, req.params.id);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || 'Error collecting construction' });
    }
  };

  return {
    getBuildingDetails,
    startUpgrade,
    downgradeBuilding,
    listConstructionQueue,
    cancelConstruction,
    collectConstruction,
  };
};

module.exports = createBuildingController;