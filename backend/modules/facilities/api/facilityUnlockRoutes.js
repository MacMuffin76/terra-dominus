const { Router } = require('express');
const { protect } = require('../../../middleware/authMiddleware');

const createFacilityUnlockRouter = (container) => {
  const router = Router();
  const facilityService = container.resolve('facilityService');
  const facilityUnlockService = container.resolve('facilityUnlockService');

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

  /**
   * POST /api/facilities/unlock/upgrade/:facilityKey
   * Améliorer une installation (avec vérification de déverrouillage)
   */
  router.post('/upgrade/:facilityKey', protect, async (req, res) => {
    try {
      const result = await facilityService.upgradeFacilityByKey(
        req.user.id, 
        req.params.facilityKey,
        facilityUnlockService
      );
      res.json(result);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error upgrading facility');
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error upgrading facility' });
    }
  });

  /**
   * GET /api/facilities/unlock/available
   * Obtenir toutes les installations avec leur statut de déverrouillage
   */
  router.get('/available', protect, async (req, res) => {
    try {
      const data = await facilityUnlockService.getAvailableFacilities(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting available facilities');
      res.status(500).json({ message: 'Error fetching available facilities', error: error.message });
    }
  });

  /**
   * GET /api/facilities/unlock/details/:facilityKey
   * Obtenir les détails d'une installation par sa clé
   */
  router.get('/details/:facilityKey', protect, async (req, res) => {
    try {
      const data = await facilityService.getFacilityDetailsByKey(req.user.id, req.params.facilityKey);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting facility details');
      const status = error.status || 500;
      res.status(status).json({ message: error.message || 'Error fetching facility details' });
    }
  });

  /**
   * GET /api/facilities/unlock/check/:facilityKey
   * Vérifier si une installation peut être construite/améliorée
   */
  router.get('/check/:facilityKey', protect, async (req, res) => {
    try {
      const targetLevel = req.query.targetLevel ? parseInt(req.query.targetLevel) : null;
      const data = await facilityUnlockService.checkFacilityUnlock(
        req.user.id, 
        req.params.facilityKey,
        targetLevel
      );
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error checking facility unlock');
      res.status(500).json({ message: 'Error checking facility unlock', error: error.message });
    }
  });

  /**
   * GET /api/facilities/unlock/progress
   * Obtenir un résumé de la progression des installations
   */
  router.get('/progress', protect, async (req, res) => {
    try {
      const data = await facilityUnlockService.getUnlockProgressSummary(req.user.id);
      res.json(data);
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting unlock progress');
      res.status(500).json({ message: 'Error fetching unlock progress', error: error.message });
    }
  });

  /**
   * GET /api/facilities/unlock/command-center-level
   * Obtenir le niveau du Centre de Commandement
   */
  router.get('/command-center-level', protect, async (req, res) => {
    try {
      const level = await facilityUnlockService.getCommandCenterLevel(req.user.id);
      res.json({ level });
    } catch (error) {
      req.logger?.error({ err: error }, 'Error getting command center level');
      res.status(500).json({ message: 'Error fetching command center level', error: error.message });
    }
  });

  return router;
};

module.exports = createFacilityUnlockRouter;
