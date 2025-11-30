/**
 * PortalController
 * HTTP request handlers for Portal System
 */

const logger = require('../utils/logger');

const portalController = ({ portalService, portalCombatService, portalSpawnerService }) => {
  /**
   * GET /api/v1/portals
   * List all active portals with optional filtering
   */
  const listPortals = async (req, res) => {
    try {
      const { tier, minDifficulty, maxDifficulty } = req.query;
      
      const filters = {};
      if (tier) filters.tier = tier;
      if (minDifficulty) filters.minDifficulty = parseInt(minDifficulty);
      if (maxDifficulty) filters.maxDifficulty = parseInt(maxDifficulty);

      const portals = await portalService.listActivePortals(filters);
      
      res.status(200).json({
        success: true,
        data: portals,
        count: portals.length
      });
    } catch (error) {
      logger.error('Error listing portals', { error: error.message, filters: req.query });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portals',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/:id
   * Get detailed information about a specific portal
   */
  const getPortalDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const portal = await portalService.getPortalById(parseInt(id));

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: 'Portal not found'
        });
      }

      res.status(200).json({
        success: true,
        data: portal
      });
    } catch (error) {
      logger.error('Error fetching portal details', { 
        portalId: req.params.id,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portal details',
        error: error.message
      });
    }
  };

  /**
   * POST /api/v1/portals/:id/attack
   * Attack a portal with units
   * Body: { units: { Infantry: 50, Tank: 10 }, tactic: 'balanced' }
   */
  const attackPortal = async (req, res) => {
    try {
      const { id } = req.params;
      const { units, tactic = 'balanced' } = req.body;
      const userId = req.user.id;

      // Validation
      if (!units || Object.keys(units).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Units are required'
        });
      }

      if (!['balanced', 'aggressive', 'defensive'].includes(tactic)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tactic. Must be: balanced, aggressive, or defensive'
        });
      }

      const result = await portalCombatService.challengePortal(
        userId,
        parseInt(id),
        units,
        tactic
      );

      res.status(200).json({
        success: true,
        message: 'Battle completed',
        data: result
      });
    } catch (error) {
      logger.error('Error attacking portal', {
        userId: req.user.id,
        portalId: req.params.id,
        error: error.message
      });

      let statusCode = 500;
      if (error.message.includes('not found') || error.message.includes('not active')) {
        statusCode = 404;
      } else if (error.message.includes('insufficient') || error.message.includes('Invalid')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * POST /api/v1/portals/:id/estimate
   * Get battle estimation without actually attacking
   * Body: { units: { Infantry: 50, Tank: 10 } }
   */
  const estimateBattle = async (req, res) => {
    try {
      const { id } = req.params;
      const { units } = req.body;

      if (!units || Object.keys(units).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Units are required'
        });
      }

      const estimation = await portalCombatService.estimateBattle(parseInt(id), units);

      res.status(200).json({
        success: true,
        data: estimation
      });
    } catch (error) {
      logger.error('Error estimating battle', {
        portalId: req.params.id,
        error: error.message
      });

      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/mastery
   * Get user's mastery progression for all tiers
   */
  const getUserMastery = async (req, res) => {
    try {
      const userId = req.user.id;
      const mastery = await portalService.getUserMastery(userId);

      res.status(200).json({
        success: true,
        data: mastery
      });
    } catch (error) {
      logger.error('Error fetching user mastery', {
        userId: req.user.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch mastery data',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/history
   * Get user's portal battle history
   */
  const getBattleHistory = async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const history = await portalService.getUserBattleHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error fetching battle history', {
        userId: req.user.id,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch battle history',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/leaderboard/:tier
   * Get leaderboard for a specific portal tier
   */
  const getLeaderboard = async (req, res) => {
    try {
      const { tier } = req.params;
      const { limit = 100 } = req.query;

      if (!['grey', 'green', 'blue', 'purple', 'red', 'golden'].includes(tier)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tier. Must be: grey, green, blue, purple, red, or golden'
        });
      }

      const leaderboard = await portalService.getLeaderboardByTier(tier, parseInt(limit));

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      logger.error('Error fetching leaderboard', {
        tier: req.params.tier,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/events
   * Get information about golden portal world events
   */
  const getGoldenPortalEvents = async (req, res) => {
    try {
      const events = await portalService.getGoldenPortalEvents();

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error('Error fetching golden portal events', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: error.message
      });
    }
  };

  /**
   * POST /api/v1/portals/spawn (Admin only)
   * Manually spawn a portal
   * Body: { tier: 'blue', x_coordinate: 100, y_coordinate: 200 }
   */
  const spawnPortal = async (req, res) => {
    try {
      const { tier, x_coordinate, y_coordinate } = req.body;

      if (!tier) {
        return res.status(400).json({
          success: false,
          message: 'Tier is required'
        });
      }

      const portal = await portalSpawnerService.spawnPortal(tier, x_coordinate, y_coordinate);

      res.status(201).json({
        success: true,
        message: 'Portal spawned successfully',
        data: portal
      });
    } catch (error) {
      logger.error('Error spawning portal', {
        tier: req.body.tier,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to spawn portal',
        error: error.message
      });
    }
  };

  /**
   * GET /api/v1/portals/stats/spawning (Admin only)
   * Get spawning statistics for monitoring
   */
  const getSpawningStats = async (req, res) => {
    try {
      const stats = await portalSpawnerService.getSpawnStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching spawning stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch spawning statistics',
        error: error.message
      });
    }
  };

  return {
    listPortals,
    getPortalDetails,
    attackPortal,
    estimateBattle,
    getUserMastery,
    getBattleHistory,
    getLeaderboard,
    getGoldenPortalEvents,
    spawnPortal,
    getSpawningStats
  };
};

module.exports = portalController;
