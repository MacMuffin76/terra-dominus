const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createFacilityUnlockRouter = (container) => {
  const router = Router();
  const facilityService = container.resolve('facilityService');

  /**
   * GET /api/facilities/unlock/list
   * Obtenir toutes les installations du joueur avec niveaux et bonus
   */
  router.get('/list', protect, async (req, res) => {
    try {
      const data = await facilityService.getPlayerFacilities(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting player facilities');
      res.status(500).json({ message: 'Error fetching facilities', error: error.message });
    }
  });

  /**
   * GET /api/facilities/unlock/details/:facilityKey
   * Obtenir les détails complets d'une installation
   */
  router.get('/details/:facilityKey', protect, async (req, res) => {
    try {
      const data = await facilityService.getFacilityDetails(req.user.id, req.params.facilityKey);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting facility details');
      res.status(500).json({ message: 'Error fetching facility details', error: error.message });
    }
  });

  /**
   * GET /api/facilities/unlock/bonuses
   * Obtenir le résumé des bonus totaux
   */
  router.get('/bonuses', protect, async (req, res) => {
    try {
      const data = await facilityService.getTotalBonuses(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting total bonuses');
      res.status(500).json({ message: 'Error fetching bonuses', error: error.message });
    }
  });

  return router;
};

module.exports = createFacilityUnlockRouter;
