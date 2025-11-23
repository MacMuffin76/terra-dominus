// backend/controllers/buildingController.js

const buildingService = require('../services/buildingService');

exports.getBuildingDetails = async (req, res) => {
  try {
    const details = await buildingService.getBuildingDetails(req.params.id);
    res.json(details);
  } catch (err) {
    console.error(err);
     res.status(err.status || 500).json({ message: err.message || 'Error fetching building details' });
  }
};

exports.upgradeBuilding = async (req, res) => {
  try {
    const result = await buildingService.upgradeBuilding(req.user.id, req.params.id);
    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Error upgrading building' });
  }
};

exports.downgradeBuilding = async (req, res) => {
  try {
    const result = await buildingService.downgradeBuilding(req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
     res.status(err.status || 500).json({ message: err.message || 'Error downgrading' });
  }
};