const express = require('express');
const router = express.Router();
const { getDefenses, getDefenseDetails, upgradeDefense, destroyDefense } = require('../controllers/defenseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/defenses', protect, getDefenses);
router.get('/defenses/:id', protect, getDefenseDetails);
router.post('/defenses/:id/upgrade', protect, upgradeDefense);
router.post('/defenses/:id/destroy', protect, destroyDefense);

module.exports = router;
