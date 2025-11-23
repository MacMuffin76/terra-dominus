// backend/routes/defenseRoutes.js

const express = require('express');
const router  = express.Router();

const {
  getDefenses,
  getDefenseDetails,
  buyDefenseUnit,
} = require('../controllers/defenseController');

// ton middleware exporte { protect }
const { protect } = require('../middleware/authMiddleware');

// Liste des défenses du joueur
router.get('/defenses', protect, getDefenses);

// Détail d’une défense précise
router.get('/defense-buildings/:id', protect, getDefenseDetails);

// Achat d’UNE unité de défense (pas de niveau)
router.post('/defense-buildings/:id/upgrade', protect, buyDefenseUnit);

module.exports = router;
