/**
 * FactionController
 * REST API endpoints for Factions & Territorial Control system
 * Handles HTTP requests for faction operations, zone queries, and contributions
 */

const { logger, runWithContext } = require('../utils/logger');

/**
 * @param {FactionService} factionService
 */
module.exports = ({ factionService }) => {
  return {
    /**
     * GET /api/v1/factions
     * Get all available factions
     */
    async getAllFactions(req, res) {
      return runWithContext(async () => {
        try {
          const factions = await factionService.getAllFactions();

          res.status(200).json({
            success: true,
            data: factions
          });
        } catch (error) {
          logger.error('Error fetching factions:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch factions'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/factions/:factionId
     * Get faction details with stats and leaderboard
     */
    async getFactionDetails(req, res) {
      return runWithContext(async () => {
        try {
          const { factionId } = req.params;

          const details = await factionService.getFactionDetails(factionId);

          res.status(200).json({
            success: true,
            data: details
          });
        } catch (error) {
          logger.error('Error fetching faction details:', error);
          
          if (error.message.includes('not found')) {
            return res.status(404).json({
              success: false,
              message: error.message
            });
          }

          res.status(500).json({
            success: false,
            message: 'Failed to fetch faction details'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/factions/leaderboard
     * Get global faction leaderboard
     */
    async getGlobalLeaderboard(req, res) {
      return runWithContext(async () => {
        try {
          const { sortBy = 'members' } = req.query;

          const leaderboard = await factionService.getGlobalLeaderboard(sortBy);

          res.status(200).json({
            success: true,
            data: leaderboard
          });
        } catch (error) {
          logger.error('Error fetching global leaderboard:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * POST /api/v1/factions/join
     * Join a faction
     * Body: { factionId: string }
     */
    async joinFaction(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;
          const { factionId } = req.body;

          if (!factionId) {
            return res.status(400).json({
              success: false,
              message: 'factionId is required'
            });
          }

          const result = await factionService.joinFaction(userId, factionId);

          res.status(201).json({
            success: true,
            message: `You have joined ${result.faction_name}!`,
            data: result
          });
        } catch (error) {
          logger.error('Error joining faction:', error);

          if (error.message.includes('already a member') || 
              error.message.includes('cooldown active') ||
              error.message.includes('does not exist')) {
            return res.status(400).json({
              success: false,
              message: error.message
            });
          }

          res.status(500).json({
            success: false,
            message: 'Failed to join faction'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * POST /api/v1/factions/leave
     * Leave current faction
     */
    async leaveFaction(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;

          const result = await factionService.leaveFaction(userId);

          res.status(200).json({
            success: true,
            message: result.message,
            data: result
          });
        } catch (error) {
          logger.error('Error leaving faction:', error);

          if (error.message.includes('not currently in a faction')) {
            return res.status(400).json({
              success: false,
              message: error.message
            });
          }

          res.status(500).json({
            success: false,
            message: 'Failed to leave faction'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/factions/my-faction
     * Get current user's faction membership and stats
     */
    async getMyFaction(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;

          const stats = await factionService.getUserFaction(userId);

          if (!stats) {
            return res.status(200).json({
              success: true,
              data: null,
              message: 'You are not currently in a faction'
            });
          }

          res.status(200).json({
            success: true,
            data: stats
          });
        } catch (error) {
          logger.error('Error fetching user faction:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch faction info'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/factions/my-history
     * Get user's faction membership history
     */
    async getMyFactionHistory(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;

          const history = await factionService.getUserFactionHistory(userId);

          res.status(200).json({
            success: true,
            data: history
          });
        } catch (error) {
          logger.error('Error fetching faction history:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch history'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/control-zones
     * Get all control zones
     */
    async getAllZones(req, res) {
      return runWithContext(async () => {
        try {
          const zones = await factionService.getAllZones();

          res.status(200).json({
            success: true,
            data: zones
          });
        } catch (error) {
          logger.error('Error fetching zones:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch zones'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/control-zones/:zoneId
     * Get zone details with control progress
     */
    async getZoneDetails(req, res) {
      return runWithContext(async () => {
        try {
          const { zoneId } = req.params;

          const details = await factionService.getZoneDetails(parseInt(zoneId, 10));

          res.status(200).json({
            success: true,
            data: details
          });
        } catch (error) {
          logger.error('Error fetching zone details:', error);

          if (error.message.includes('not found')) {
            return res.status(404).json({
              success: false,
              message: error.message
            });
          }

          res.status(500).json({
            success: false,
            message: 'Failed to fetch zone details'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/control-zones/at/:x/:y
     * Get zone at specific coordinates
     */
    async getZoneByCoordinates(req, res) {
      return runWithContext(async () => {
        try {
          const { x, y } = req.params;

          const zone = await factionService.getZoneByCoordinates(
            parseInt(x, 10),
            parseInt(y, 10)
          );

          if (!zone) {
            return res.status(200).json({
              success: true,
              data: null,
              message: 'No control zone at these coordinates'
            });
          }

          res.status(200).json({
            success: true,
            data: zone
          });
        } catch (error) {
          logger.error('Error fetching zone by coordinates:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch zone'
          });
        }
      }, req.headers['x-trace-id']);
    },

    /**
     * GET /api/v1/factions/my-bonuses
     * Get user's active faction bonuses
     */
    async getMyBonuses(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;

          const bonuses = await factionService.getUserActiveBonuses(userId);

          res.status(200).json({
            success: true,
            data: bonuses
          });
        } catch (error) {
          logger.error('Error fetching user bonuses:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to fetch bonuses'
          });
        }
      }, req.headers['x-trace-id']);
    }
  };
};
