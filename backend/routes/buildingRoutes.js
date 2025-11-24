const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBuildingDetails,
  startUpgrade,
  listConstructionQueue,
  cancelConstruction,
  collectConstruction,
} = require('../controllers/buildingController');

// Liste de la file de construction
// GET /api/buildings/construction/queue
router.get('/construction/queue', protect, listConstructionQueue);

// Annuler une construction
// DELETE /api/buildings/construction/queue/:id
router.delete('/construction/queue/:id', protect, cancelConstruction);

// Collecter une construction terminée
// POST /api/buildings/construction/queue/:id/collect
router.post('/construction/queue/:id/collect', protect, collectConstruction);


// Détails d'un bâtiment
// GET /api/buildings/:id
router.get('/:id', protect, getBuildingDetails);

// Démarrer un upgrade
// POST /api/buildings/:id/start-upgrade
router.post('/:id/start-upgrade', protect, startUpgrade);

module.exports = router;