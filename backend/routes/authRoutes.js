const express = require('express');
const { registerUser, loginUser, refreshSession } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../validation/authValidation');
const { authLimiter } = require('../middleware/rateLimiters');
const { protect } = require('../middleware/authMiddleware');
const { getTokenService } = require('../services/TokenService');
const { getLogger } = require('../utils/logger');

const router = express.Router();
const logger = getLogger({ module: 'AuthRoutes' });

// Auth endpoints avec rate limiting strict
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/refresh', authLimiter, validate(refreshSchema), refreshSession);

// Récupérer les infos de l'utilisateur connecté
router.get('/me', protect, async (req, res) => {
  try {
    // req.user est déjà défini par le middleware protect
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user?.id }, 'Failed to get user info');
    res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur' });
  }
});

// Logout avec révocation de token
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const tokenService = getTokenService();
    
    await tokenService.revokeToken(token);
    
    // Enregistrer l'heure de déconnexion pour le calcul de rattrapage offline
    req.user.last_logout = new Date();
    await req.user.save();
    
    logger.info({ userId: req.user.id }, 'User logged out successfully');
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    logger.error({ err: error, userId: req.user?.id }, 'Logout failed');
    res.status(500).json({ message: 'Échec de la déconnexion' });
  }
});

module.exports = router;