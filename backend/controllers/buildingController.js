const { getLogger } = require('../utils/logger');

const createBuildingController = ({ buildingService }) => {
  const logger = getLogger({ module: 'BuildingController' });

  const getBuildingDetails = async (req, res) => {
    try {
      const details = await buildingService.getBuildingDetails(req.params.id);
      res.json(details);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching building details');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching building details' });
    }
  };

  const startUpgrade = async (req, res) => {
    try {
      const result = await buildingService.startUpgrade(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, buildingId: req.params.id }, 'Building upgrade started');
      return res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error upgrading building');
      res.status(err.status || 500).json({ message: err.message || 'Error upgrading building' });
    }
  };

  const downgradeBuilding = async (req, res) => {
    try {
      res.status(410).json({ message: 'Downgrade not supported with construction queue' });
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error downgrading building');
      res.status(err.status || 500).json({ message: err.message || 'Error downgrading' });
    }
  };

  const listConstructionQueue = async (req, res) => {
    try {
      const queue = await buildingService.listConstructionQueue(req.user.id);
      res.json(queue);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching construction queue');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching construction queue' });
    }
  };

  const cancelConstruction = async (req, res) => {
    try {
      const result = await buildingService.cancelConstruction(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, queueId: req.params.id }, 'Construction cancelled');
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error cancelling construction');
      res.status(err.status || 500).json({ message: err.message || 'Error cancelling construction' });
    }
  };

  const collectConstruction = async (req, res) => {
    try {
      const result = await buildingService.collectConstruction(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, queueId: req.params.id }, 'Construction collected');
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error collecting construction');
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