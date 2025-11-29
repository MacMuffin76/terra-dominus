const rateLimit = require('express-rate-limit');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'RateLimiters' });

/**
 * Rate limiter strict pour les actions critiques
 * - Attaques
 * - Espionnage
 * - Commerce (création routes)
 * - Colonisation
 * 
 * Limite: 5 requêtes par minute par IP
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { 
    error: 'Too Many Requests',
    message: 'Trop de requêtes. Veuillez réessayer dans 1 minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ 
      ip: req.ip, 
      userId: req.user?.id,
      path: req.path 
    }, 'Rate limit strict dépassé');
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Trop de requêtes. Veuillez réessayer dans 1 minute.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter modéré pour les lectures fréquentes
 * - Liste des attaques/missions
 * - Détails des villes
 * - Carte du monde
 * 
 * Limite: 30 requêtes par minute par IP
 */
const moderateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Too Many Requests',
    message: 'Trop de requêtes. Veuillez ralentir.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    }, 'Rate limit modéré dépassé');
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Trop de requêtes. Veuillez ralentir.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pour l'authentification
 * - Login
 * - Register
 * 
 * Limite: 10 tentatives par 15 minutes par IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too Many Requests',
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte que les échecs
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      username: req.body?.username,
      path: req.path
    }, 'Rate limit authentification dépassé');
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

/**
 * Rate limiter flexible pour les actions utilisateur
 * - Amélioration bâtiments
 * - Entraînement unités
 * - Recherches
 * 
 * Limite: 60 requêtes par minute par IP
 */
const flexibleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'Too Many Requests',
    message: 'Trop de requêtes. Veuillez patienter.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter global par défaut
 * Appliqué à tous les endpoints non spécifiés
 * 
 * Limite: 100 requêtes par 15 minutes par IP
 */
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too Many Requests',
    message: 'Limite de requêtes atteinte. Réessayez plus tard.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  strictLimiter,
  moderateLimiter,
  authLimiter,
  flexibleLimiter,
  defaultLimiter
};
