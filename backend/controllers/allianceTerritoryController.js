const AllianceTerritoryService = require('../modules/alliances/application/AllianceTerritoryService');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'AllianceTerritoryController' });
const territoryService = new AllianceTerritoryService();

/**
 * Alliance Territory Controller - HTTP endpoints for territory management
 */
const allianceTerritoryController = {
  /**
   * GET /alliances/:allianceId/territories
   * Get all territories controlled by an alliance
   */
  async getAllianceTerritories(req, res) {
    try {
      const { allianceId } = req.params;
      const userId = req.user.id;

      const territories = await territoryService.getAllianceTerritories(
        parseInt(allianceId),
        userId
      );

      res.status(200).json({
        success: true,
        territories,
      });
    } catch (error) {
      logger.error('Error in getAllianceTerritories', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve territories',
      });
    }
  },

  /**
   * GET /territories/coords/:x/:y
   * Get territory by coordinates
   */
  async getTerritoryByCoords(req, res) {
    try {
      const { x, y } = req.params;

      const territory = await territoryService.getTerritoryByCoords(
        parseInt(x),
        parseInt(y)
      );

      res.status(200).json({
        success: true,
        territory,
      });
    } catch (error) {
      logger.error('Error in getTerritoryByCoords', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve territory',
      });
    }
  },

  /**
   * POST /alliances/:allianceId/territories/claim
   * Initiate territory capture
   */
  async claimTerritory(req, res) {
    try {
      const { allianceId } = req.params;
      const userId = req.user.id;
      const { name, territoryType, coordX, coordY } = req.body;

      // Validation
      if (!territoryType || coordX === undefined || coordY === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: territoryType, coordX, coordY',
        });
      }

      const territory = await territoryService.initiateCapture(
        parseInt(allianceId),
        userId,
        { name, territoryType, coordX: parseInt(coordX), coordY: parseInt(coordY) }
      );

      res.status(201).json({
        success: true,
        message: 'Territory claimed successfully',
        territory,
      });
    } catch (error) {
      logger.error('Error in claimTerritory', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to claim territory',
      });
    }
  },

  /**
   * POST /alliances/:allianceId/territories/:territoryId/upgrade
   * Upgrade territory defense
   */
  async upgradeDefense(req, res) {
    try {
      const { allianceId, territoryId } = req.params;
      const userId = req.user.id;

      const result = await territoryService.upgradeDefense(
        parseInt(allianceId),
        parseInt(territoryId),
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Territory defense upgraded successfully',
        territory: result.territory,
        cost: result.cost,
      });
    } catch (error) {
      logger.error('Error in upgradeDefense', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to upgrade defense',
      });
    }
  },

  /**
   * POST /alliances/:allianceId/territories/:territoryId/reinforce
   * Reinforce garrison
   */
  async reinforceGarrison(req, res) {
    try {
      const { allianceId, territoryId } = req.params;
      const userId = req.user.id;
      const { strength } = req.body;

      // Validation
      if (!strength || isNaN(strength) || strength <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid strength value required',
        });
      }

      const territory = await territoryService.reinforceGarrison(
        parseInt(allianceId),
        parseInt(territoryId),
        userId,
        parseInt(strength)
      );

      res.status(200).json({
        success: true,
        message: 'Garrison reinforced successfully',
        territory,
      });
    } catch (error) {
      logger.error('Error in reinforceGarrison', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to reinforce garrison',
      });
    }
  },

  /**
   * POST /alliances/:allianceId/territories/:territoryId/withdraw
   * Withdraw garrison
   */
  async withdrawGarrison(req, res) {
    try {
      const { allianceId, territoryId } = req.params;
      const userId = req.user.id;
      const { strength } = req.body;

      // Validation
      if (!strength || isNaN(strength) || strength <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid strength value required',
        });
      }

      const territory = await territoryService.withdrawGarrison(
        parseInt(allianceId),
        parseInt(territoryId),
        userId,
        parseInt(strength)
      );

      res.status(200).json({
        success: true,
        message: 'Garrison withdrawn successfully',
        territory,
      });
    } catch (error) {
      logger.error('Error in withdrawGarrison', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to withdraw garrison',
      });
    }
  },

  /**
   * DELETE /alliances/:allianceId/territories/:territoryId
   * Abandon territory
   */
  async abandonTerritory(req, res) {
    try {
      const { allianceId, territoryId } = req.params;
      const userId = req.user.id;

      const result = await territoryService.abandonTerritory(
        parseInt(allianceId),
        parseInt(territoryId),
        userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error in abandonTerritory', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to abandon territory',
      });
    }
  },

  /**
   * GET /territories/range
   * Get territories in range (for map display)
   */
  async getTerritoriesInRange(req, res) {
    try {
      const { x, y, range } = req.query;

      // Validation
      if (x === undefined || y === undefined || range === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required query parameters: x, y, range',
        });
      }

      const territories = await territoryService.getTerritoriesInRange(
        parseInt(x),
        parseInt(y),
        parseInt(range)
      );

      res.status(200).json({
        success: true,
        territories,
      });
    } catch (error) {
      logger.error('Error in getTerritoriesInRange', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve territories',
      });
    }
  },

  /**
   * GET /alliances/:allianceId/territories/bonuses
   * Get territory bonuses for alliance
   */
  async getTerritoryBonuses(req, res) {
    try {
      const { allianceId } = req.params;
      const userId = req.user.id;

      const bonuses = await territoryService.calculateBonuses(userId, parseInt(allianceId));

      res.status(200).json({
        success: true,
        bonuses,
      });
    } catch (error) {
      logger.error('Error in getTerritoryBonuses', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to calculate bonuses',
      });
    }
  },

  /**
   * GET /territories
   * Get all territories (for world map)
   */
  async getAllTerritories(req, res) {
    try {
      const { limit, offset, territoryType } = req.query;

      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);
      if (territoryType) options.territoryType = territoryType;

      const result = await territoryService.getAllTerritories(options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error in getAllTerritories', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to retrieve territories',
      });
    }
  },
};

module.exports = allianceTerritoryController;
