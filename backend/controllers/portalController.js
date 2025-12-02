/**
 * PortalController
 * HTTP request handlers for Portal System
 */

const { getLogger } = require('../utils/logger');
const logger = getLogger({ module: 'PortalController' });

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
      logger.error({ err: error, filters: req.query }, 'Error listing portals');
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
      logger.error({ err: error, portalId: req.params.id }, 'Error fetching portal details');
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
      logger.error({ err: error, userId: req.user.id, portalId: req.params.id }, 'Error attacking portal');

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
      logger.error({ err: error, portalId: req.params.id }, 'Error estimating battle');

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
      logger.error({ err: error, userId: req.user.id }, 'Error fetching user mastery');
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
      logger.error({ err: error, userId: req.user.id }, 'Error fetching battle history');
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
      logger.error({ err: error, tier: req.params.tier }, 'Error fetching leaderboard');
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
      logger.error({ err: error }, 'Error fetching golden portal events');
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
      logger.error({ err: error, tier: req.body.tier }, 'Error spawning portal');
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
      logger.error({ err: error }, 'Error fetching spawning stats');
      res.status(500).json({
        success: false,
        message: 'Failed to fetch spawning statistics',
        error: error.message
      });
    }
  };

  return {
    listPortals,
    getActivePortals: listPortals, // Alias pour compatibilité avec les routes
    getPortalDetails,
    getPortalById: getPortalDetails, // Alias pour compatibilité avec les routes
    attackPortal,
    estimateBattle,
    getUserMastery,
    getBattleHistory,
    getLeaderboard,
    getGoldenPortalEvents,
    spawnPortal,
    getSpawningStats,
    // Stubs pour les méthodes manquées par les routes
    getPortalsNearCoordinates: async (req, res) => {
      try {
        const { coordX, coordY } = req.params;
        const radius = parseInt(req.query.radius) || 50;
        
        // Pour l'instant, retourner un tableau vide
        // TODO: Implémenter la logique de recherche par coordonnées
        res.status(200).json({
          success: true,
          data: [],
          message: 'Portal proximity search not yet implemented'
        });
      } catch (error) {
        logger.error({ err: error }, 'Error getting portals near coordinates');
        res.status(500).json({ success: false, message: error.message });
      }
    },
    getUserExpeditions: async (req, res) => {
      try {
        const userId = req.user.id;
        const { status } = req.query;
        
        const filters = {};
        if (status) filters.status = status;

        const expeditions = await portalService.getUserExpeditions(userId, filters);
        
        res.status(200).json({
          success: true,
          data: expeditions,
          count: expeditions.length
        });
      } catch (error) {
        logger.error({ err: error, userId: req.user.id }, 'Error getting user expeditions');
        res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch expeditions',
          error: error.message 
        });
      }
    },
    getPortalStatistics: async (req, res) => {
      try {
        const stats = await portalService.getPortalStatistics();
        
        res.status(200).json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error({ err: error }, 'Error getting portal statistics');
        res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch statistics',
          error: error.message 
        });
      }
    },
    getPortalsNear: async (req, res) => {
      try {
        const { x, y } = req.params;
        const { radius = 50 } = req.query;

        const portals = await portalService.getPortalsNear(
          parseInt(x),
          parseInt(y),
          parseInt(radius)
        );

        res.status(200).json({
          success: true,
          data: portals,
          count: portals.length
        });
      } catch (error) {
        logger.error({ err: error, x: req.params.x, y: req.params.y }, 'Error getting portals near coordinates');
        res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch nearby portals',
          error: error.message 
        });
      }
    },
    challengePortal: async (req, res) => {
      try {
        res.status(501).json({
          success: false,
          message: 'Portal challenge not yet implemented'
        });
      } catch (error) {
        logger.error({ err: error }, 'Error challenging portal');
        res.status(500).json({ success: false, message: error.message });
      }
    }
  };
};

module.exports = portalController;
