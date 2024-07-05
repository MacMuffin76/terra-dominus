const express = require('express');
const router = express.Router();
const { getTrainingCenters, getTrainingDetails, upgradeTraining, destroyTraining } = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');

router.get('/training-centers', protect, getTrainingCenters);
router.get('/training-centers/:id', protect, getTrainingDetails);
router.post('/training-centers/:id/upgrade', protect, upgradeTraining);
router.post('/training-centers/:id/destroy', protect, destroyTraining);

module.exports = router;
