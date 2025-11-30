/**
 * PortalController
 * Gère les requêtes HTTP pour les portails
 */

const logger = require('../utils/logger');

const portalController = ({ portalService }) => {
  /**
   * GET /api/v1/portals
   * Liste tous les portails actifs
   */
  const getActivePortals = async (req, res) => {
    try {
      const portals = await portalService.getActivePortals();
      
      res.status(200).json({
        success: true,
        data: portals,
        count: portals.length
      });
    } catch (error) {
      logger.error('Error fetching active portals', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portals',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/near/:coordX/:coordY
   * Liste les portails proches de coordonnées spécifiques
   */
  const getPortalsNearCoordinates = async (req, res) => {
    try {
      const { coordX, coordY } = req.params;
      const radius = parseInt(req.query.radius) || 50;

      const portals = await portalService.getPortalsNearCoordinates(
        parseInt(coordX),
        parseInt(coordY),
        radius
      );

      res.status(200).json({
        success: true,
        data: portals,
        count: portals.length
      });
    } catch (error) {
      logger.error('Error fetching portals near coordinates', { 
        coordX: req.params.coordX,
        coordY: req.params.coordY,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch nearby portals',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/:id
   * Détails d'un portail spécifique
   */
  const getPortalById = async (req, res) => {
    try {
      const { id } = req.params;
      const portal = await portalService.getPortalById(parseInt(id));

      res.status(200).json({
        success: true,
        data: portal
      });
    } catch (error) {
      logger.error('Error fetching portal', { 
        portalId: req.params.id,
        error: error.message 
      });
      
      const statusCode = error.message === 'Portal not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * POST /api/v1/portals/:id/challenge
   * Challenge un portail avec des unités
   * Body: { cityId, units: { Infantry: 50, Tank: 10 } }
   */
  const challengePortal = async (req, res) => {
    try {
      const { id } = req.params;
      const { cityId, units } = req.body;
      const userId = req.user.id; // From auth middleware

      // Validation
      if (!cityId || !units || Object.keys(units).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: cityId and units'
        });
      }

      // Challenge the portal
      const expedition = await portalService.challengePortal(
        userId,
        parseInt(id),
        cityId,
        units
      );

      res.status(201).json({
        success: true,
        message: 'Expedition launched successfully',
        data: expedition
      });
    } catch (error) {
      logger.error('Error challenging portal', {
        userId: req.user.id,
        portalId: req.params.id,
        error: error.message
      });

      // Handle specific error cases
      let statusCode = 500;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('does not belong') || error.message.includes('expired')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/expeditions
   * Liste les expéditions de l'utilisateur connecté
   */
  const getUserExpeditions = async (req, res) => {
    try {
      const userId = req.user.id;
      const status = req.query.status || null;

      const expeditions = await portalService.getUserExpeditions(userId, status);

      res.status(200).json({
        success: true,
        data: expeditions,
        count: expeditions.length
      });
    } catch (error) {
      logger.error('Error fetching user expeditions', {
        userId: req.user.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expeditions',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/statistics
   * Statistiques générales des portails
   */
  const getPortalStatistics = async (req, res) => {
    try {
      const stats = await portalService.getPortalStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching portal statistics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  };

  return {
    getActivePortals,
    getPortalsNearCoordinates,
    getPortalById,
    challengePortal,
    getUserExpeditions,
    getPortalStatistics
  };
};

module.exports = portalController;
