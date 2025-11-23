// backend/routes/unitRoutes.js

const express = require('express');
const router = express.Router();
const { getUserUnits } = require('../controllers/unitController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/units
router.get('/units', protect, getUserUnits);

module.exports = router;
