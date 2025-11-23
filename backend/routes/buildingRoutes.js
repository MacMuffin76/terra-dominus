const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBuildingDetails,
  upgradeBuilding,
  listConstructionQueue,
  cancelConstruction,
  accelerateConstruction,
} = require('../controllers/buildingController');

// Liste de la file de construction
// GET /api/buildings/construction/queue
router.get('/construction/queue', protect, listConstructionQueue);

// Annuler une construction
// DELETE /api/buildings/construction/queue/:id
router.delete('/construction/queue/:id', protect, cancelConstruction);

// Accélérer une construction
// POST /api/buildings/construction/queue/:id/accelerate
router.post('/construction/queue/:id/accelerate', protect, accelerateConstruction);


// Détails d'un bâtiment
// GET /api/buildings/:id
router.get('/:id', protect, getBuildingDetails);

// Améliorer un bâtiment
// PUT /api/buildings/:id/upgrade
router.put('/:id/upgrade', protect, upgradeBuilding);

module.exports = router;
