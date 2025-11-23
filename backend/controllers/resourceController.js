// backend/controllers/resourceController.js

const resourceService = require('../services/resourceService');

exports.getResourceBuildings = async (req, res) => {
  try {
     const buildings = await resourceService.getResourceBuildings(req.user.id);
    return res.json(buildings);
  } catch (err) {
    console.error('Error fetching resource buildings:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de la récupération des bâtiments de ressource.' });
  }
};
exports.getBuildingDetails = async (req, res) => {
  try {
     const details = await resourceService.getResourceBuildingDetails(req.user.id, req.params.id);
    return res.json(details);
  } catch (err) {
    console.error('Error fetching building details:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de la récupération du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/upgrade
 */
exports.upgradeBuilding = async (req, res) => {
  try {
    const result = await resourceService.upgradeResourceBuilding(req.user.id, req.params.id);
    return res.json(result);
  } catch (err) {
    console.error('Error upgrading building:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de l’amélioration du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/downgrade
 */
exports.downgradeBuilding = async (req, res) => {
  try {
    const result = await resourceService.downgradeResourceBuilding(req.user.id, req.params.id);
    return res.json(result);
  } catch (err) {
    console.error('Erreur downgrade:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors du rétrogradage du bâtiment.' });
  }
};

/**
 * POST /resources/resource-buildings/:id/destroy
 */
exports.destroyBuilding = async (req, res) => {
  try {
    const result = await resourceService.destroyResourceBuilding(req.user.id, req.params.id);
    return res.json(result);
  } catch (err) {
    console.error('Error destroying building:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de la destruction du bâtiment.' });
  }
};

  exports.getUserResources = async (req, res) => {
  try {
    const resources = await resourceService.getUserResources(req.user.id);
    return res.json(resources);
  } catch (err) {
    console.error('Error fetching user resources:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de la récupération des ressources.' });
  }
};

/**
 * POST /resources/save
 */
exports.saveUserResources = async (req, res) => {
  try {
    const result = await resourceService.saveUserResources(req.user.id, req.body.resources);
    return res.json(result);
  } catch (err) {
    console.error('Error saving resources:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Erreur lors de la sauvegarde des ressources.' });
  }
};