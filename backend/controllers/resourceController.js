const { getLogger } = require('../utils/logger');

// backend/controllers/resourceController.js

const createResourceController = ({ resourceService }) => {
  const logger = getLogger({ module: 'ResourceController' });

  const getResourceBuildings = async (req, res) => {
    try {
      const buildings = await resourceService.getResourceBuildings(req.user.id);
      return res.json(buildings);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching resource buildings');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des bâtiments de resource.' });
    }
  };

  const getAllowedResourceBuildings = async (req, res) => {
    try {
      const allowed = resourceService.getAllowedResourceBuildingNames();
      return res.json(allowed);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching allowed resource buildings');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des bâtiments de ressource autorisés.' });
    }
  };

  const getBuildingDetails = async (req, res) => {
    try {
      const details = await resourceService.getResourceBuildingDetails(req.user.id, req.params.id);
      return res.json(details);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching building details');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération du bâtiment.' });
    }
  };

  /**
   * @openapi
   * /api/v1/resources/buildings/{id}/upgrade:
   *   post:
   *     summary: Améliorer un bâtiment de ressources
   *     tags: [Resources]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Bâtiment amélioré avec succès
   *       400:
   *         description: Ressources insuffisantes ou niveau max atteint
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const upgradeBuilding = async (req, res) => {
    try {
      const result = await resourceService.upgradeResourceBuilding(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, buildingId: req.params.id }, 'Resource building upgraded');
      
      // Récupérer les données complètes du bâtiment après l'upgrade
      const building = await resourceService.getResourceBuildingDetails(req.user.id, req.params.id);
      
      return res.json({
        ...result,
        building: building
      });
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error upgrading building');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de l’amélioration du bâtiment.' });
    }
  };

  const downgradeBuilding = async (req, res) => {
    try {
      const result = await resourceService.downgradeResourceBuilding(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, buildingId: req.params.id }, 'Resource building downgraded');
      return res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Erreur downgrade');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors du rétrogradage du bâtiment.' });
    }
  };

  const destroyBuilding = async (req, res) => {
    try {
      const result = await resourceService.destroyResourceBuilding(req.user.id, req.params.id);
      (req.logger || logger).audit({ userId: req.user.id, buildingId: req.params.id }, 'Resource building destroyed');
      return res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error destroying building');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la destruction du bâtiment.' });
    }
  };

  /**
   * @openapi
   * /api/v1/resources:
   *   get:
   *     summary: Récupérer les ressources de l'utilisateur
   *     tags: [Resources]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Ressources de l'utilisateur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 wood:
   *                   type: number
   *                 stone:
   *                   type: number
   *                 iron:
   *                   type: number
   *                 food:
   *                   type: number
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserResources = async (req, res) => {
    try {
      const resources = await resourceService.getUserResources(req.user.id);
      return res.json(resources);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching user resources');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la récupération des ressources.' });
    }
  };

  const saveUserResources = async (req, res) => {
    try {
      const result = await resourceService.saveUserResources(req.user.id, req.body.resources);
      (req.logger || logger).audit({ userId: req.user.id }, 'User resources saved');
      return res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error saving resources');
      return res
        .status(err.status || 500)
        .json({ message: err.message || 'Erreur lors de la sauvegarde des ressources.' });
    }
  };

  const updateUserResources = async (userId) => {
    await resourceService.getUserResources(userId);
  };

  return {
    getResourceBuildings,
    getBuildingDetails,
    upgradeBuilding,
    downgradeBuilding,
    destroyBuilding,
    getUserResources,
    saveUserResources,
    updateUserResources,
    getAllowedResourceBuildings,
  };
};

module.exports = createResourceController;