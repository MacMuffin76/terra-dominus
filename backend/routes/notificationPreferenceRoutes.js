const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const notificationPreferencesService = require('../services/notificationPreferencesService');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const prefs = await notificationPreferencesService.getPreferences(req.user.id);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const { emailEnabled, pushEnabled, inAppEnabled } = req.body;
    const prefs = await notificationPreferencesService.updatePreferences(req.user.id, {
      ...(emailEnabled !== undefined ? { emailEnabled: Boolean(emailEnabled) } : {}),
      ...(pushEnabled !== undefined ? { pushEnabled: Boolean(pushEnabled) } : {}),
      ...(inAppEnabled !== undefined ? { inAppEnabled: Boolean(inAppEnabled) } : {}),
    });
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;