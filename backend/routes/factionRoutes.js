/**
 * Faction Routes
 * REST API routes for Factions & Territorial Control system
 */

const express = require('express');
const { protect } = require('../middleware/authMiddleware');

/**
 * @param {Object} factionController
 */
module.exports = (factionController) => {
  const router = express.Router();

  // All faction routes require authentication
  router.use(protect);

  // ========================================
  // FACTION ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/factions
   * Get all available factions
   */
  router.get('/', factionController.getAllFactions);

  /**
   * GET /api/v1/factions/leaderboard
   * Get global faction rankings
   * Query params: sortBy (members/zones/contribution)
   */
  router.get('/leaderboard', factionController.getGlobalLeaderboard);

  /**
   * GET /api/v1/factions/my-faction
   * Get current user's faction membership and stats
   */
  router.get('/my-faction', factionController.getMyFaction);

  /**
   * GET /api/v1/factions/my-history
   * Get user's faction membership history
   */
  router.get('/my-history', factionController.getMyFactionHistory);

  /**
   * GET /api/v1/factions/my-bonuses
   * Get user's active faction bonuses
   */
  router.get('/my-bonuses', factionController.getMyBonuses);

  /**
   * POST /api/v1/factions/join
   * Join a faction
   * Body: { factionId: string }
   */
  router.post('/join', factionController.joinFaction);

  /**
   * POST /api/v1/factions/leave
   * Leave current faction
   */
  router.post('/leave', factionController.leaveFaction);

  /**
   * GET /api/v1/factions/:factionId
   * Get faction details with stats and leaderboard
   */
  router.get('/:factionId', factionController.getFactionDetails);

  // ========================================
  // CONTROL ZONE ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/factions/zones
   * Get all control zones
   */
  router.get('/zones/all', factionController.getAllZones);

  /**
   * GET /api/v1/factions/zones/:zoneId
   * Get zone details with control progress
   */
  router.get('/zones/:zoneId', factionController.getZoneDetails);

  /**
   * GET /api/v1/factions/zones/at/:x/:y
   * Get zone at specific coordinates
   */
  router.get('/zones/at/:x/:y', factionController.getZoneByCoordinates);

  return router;
};
