const { Router } = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

const router = Router();

router.post('/track', protect, asyncHandler(analyticsController.track));

module.exports = router;