/**
 * Portal Routes
 * API endpoints pour le système de portails PvE
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

module.exports = (container) => {
  const portalController = require('../controllers/portalController')({
    portalService: container.resolve('portalService')
  });

  /**
   * @route   GET /api/v1/portals
   * @desc    Get all active portals
   * @access  Protected
   */
  router.get('/', protect, portalController.getActivePortals);

  /**
   * @route   GET /api/v1/portals/near/:coordX/:coordY
   * @desc    Get portals near specific coordinates
   * @query   radius (optional, default 50)
   * @access  Protected
   */
  router.get('/near/:coordX/:coordY', protect, portalController.getPortalsNearCoordinates);

  /**
   * @route   GET /api/v1/portals/expeditions
   * @desc    Get user's portal expeditions
   * @query   status (optional: 'traveling', 'victory', 'defeat')
   * @access  Protected
   */
  router.get('/expeditions', protect, portalController.getUserExpeditions);

  /**
   * @route   GET /api/v1/portals/statistics
   * @desc    Get portal statistics
   * @access  Protected
   */
  router.get('/statistics', protect, portalController.getPortalStatistics);

  /**
   * @route   GET /api/v1/portals/:id
   * @desc    Get portal details
   * @access  Protected
   */
  router.get('/:id', protect, portalController.getPortalById);

  /**
   * @route   POST /api/v1/portals/:id/challenge
   * @desc    Challenge a portal with units
   * @body    { cityId: number, units: { Infantry: 50, Tank: 10 } }
   * @access  Protected
   */
  router.post('/:id/challenge', protect, portalController.challengePortal);

  return router;
};
