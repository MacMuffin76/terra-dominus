const express = require('express');
const router = express.Router();
const { getResearchItems, getResearchDetails, upgradeResearch, destroyResearch } = require('../controllers/researchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/research-items', protect, getResearchItems);
router.get('/research-items/:id', protect, getResearchDetails);
router.post('/research-items/:id/upgrade', protect, upgradeResearch);
router.post('/research-items/:id/destroy', protect, destroyResearch);

module.exports = router;
