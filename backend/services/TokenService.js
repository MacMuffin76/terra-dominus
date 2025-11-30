const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const { getLogger } = require('../utils/logger');
const { getJwtSecret } = require('../config/jwtConfig');

const logger = getLogger({ module: 'TokenService' });
const JWT_SECRET = getJwtSecret();

// Configuration Redis avec fallback
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '2h';
const REFRESH_TOKEN_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000); // 7 jours

/**
 * Service de gestion des tokens JWT avec blacklist Redis
 * Permet la révocation et la rotation des tokens
 */
class TokenService {
  constructor() {
    this.redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn({ times, delay }, 'Retry Redis connection');
        return delay;
      }
    });

    this.redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected for TokenService');
    });
  }

  /**
   * Génère un access token JWT
   * @param {Object} payload - Données à encoder dans le token
   * @param {number} payload.id - ID de l'utilisateur
   * @param {string} payload.username - Nom d'utilisateur
   * @returns {string} Token JWT signé
   */
  generateAccessToken(payload) {
    return jwt.sign(
      { 
        id: payload.id, 
        username: payload.username,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );
  }

  /**
   * Génère un refresh token JWT
   * @param {Object} payload - Données à encoder
   * @param {number} payload.id - ID de l'utilisateur
   * @returns {string} Refresh token JWT signé
   */
  generateRefreshToken(payload) {
    return jwt.sign(
      { 
        id: payload.id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_TTL_MS / 1000 + 's' }
    );
  }

  /**
   * Vérifie et décode un token
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload décodé
   * @throws {Error} Si le token est invalide ou expiré
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn({ err: error }, 'Token verification failed');
      throw error;
    }
  }

  /**
   * Révoque un token en l'ajoutant à la blacklist Redis
   * Le token reste blacklisté jusqu'à son expiration naturelle
   * @param {string} token - Token à révoquer
   * @returns {Promise<void>}
   */
  async revokeToken(token) {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        logger.warn('Cannot revoke token without expiration');
        return;
      }

      // Calculer le TTL restant jusqu'à expiration du token
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl <= 0) {
        logger.debug('Token already expired, no need to blacklist');
        return;
      }

      // Ajouter à la blacklist avec TTL automatique
      const key = `blacklist:${token}`;
      await this.redis.setex(key, ttl, '1');
      
      logger.info({ userId: decoded.id, ttl }, 'Token revoked');
    } catch (error) {
      logger.error({ err: error }, 'Error revoking token');
      throw error;
    }
  }

  /**
   * Vérifie si un token est dans la blacklist
   * @param {string} token - Token à vérifier
   * @returns {Promise<boolean>} True si blacklisté, false sinon
   */
  async isTokenBlacklisted(token) {
    try {
      const key = `blacklist:${token}`;
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error({ err: error }, 'Error checking token blacklist');
      // En cas d'erreur Redis, on autorise par défaut (fail open)
      // En production, considérer fail closed selon les besoins de sécurité
      return false;
    }
  }

  /**
   * Rotation d'un refresh token
   * Révoque l'ancien et génère un nouveau
   * @param {string} oldRefreshToken - Ancien refresh token
   * @returns {Promise<Object>} Nouveau access token et refresh token
   * @throws {Error} Si le token est invalide ou déjà blacklisté
   */
  async rotateRefreshToken(oldRefreshToken) {
    try {
      // Vérifier si déjà blacklisté
      if (await this.isTokenBlacklisted(oldRefreshToken)) {
        const error = new Error('Refresh token has been revoked');
        error.status = 401;
        throw error;
      }

      // Vérifier et décoder le token
      const decoded = this.verifyToken(oldRefreshToken);

      if (decoded.type !== 'refresh') {
        const error = new Error('Invalid token type');
        error.status = 401;
        throw error;
      }

      // Révoquer l'ancien token
      await this.revokeToken(oldRefreshToken);

      // Générer nouveaux tokens
      const accessToken = this.generateAccessToken({ 
        id: decoded.id, 
        username: decoded.username 
      });
      const refreshToken = this.generateRefreshToken({ 
        id: decoded.id 
      });

      logger.info({ userId: decoded.id }, 'Tokens rotated successfully');

      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error({ err: error }, 'Error rotating refresh token');
      throw error;
    }
  }

  /**
   * Révoque tous les tokens d'un utilisateur
   * Utile lors d'un changement de mot de passe ou logout de tous les appareils
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  async revokeAllUserTokens(userId) {
    try {
      // Ajouter l'utilisateur à une liste de révocation globale
      const key = `user_revoked:${userId}`;
      const now = Math.floor(Date.now() / 1000); // En secondes pour correspondre à iat
      
      // Stocker le timestamp de révocation
      // Tous les tokens émis avant ce timestamp seront considérés invalides
      await this.redis.set(key, now);
      
      logger.info({ userId, timestamp: now }, 'All user tokens revoked');
    } catch (error) {
      logger.error({ err: error, userId }, 'Error revoking all user tokens');
      throw error;
    }
  }

  /**
   * Vérifie si un token a été émis avant une révocation globale de l'utilisateur
   * @param {Object} decoded - Token décodé
   * @returns {Promise<boolean>} True si le token est valide, false si révoqué
   */
  async isTokenValidForUser(decoded) {
    try {
      const key = `user_revoked:${decoded.id}`;
      const revokedAt = await this.redis.get(key);
      
      if (!revokedAt) {
        return true; // Pas de révocation globale
      }

      // Vérifier si le token a été émis avant la révocation
      const tokenIssuedAt = decoded.iat; // iat est déjà en secondes
      const isValid = tokenIssuedAt > parseInt(revokedAt);
      
      if (!isValid) {
        logger.info({ userId: decoded.id }, 'Token invalidated by global user revocation');
      }
      
      return isValid;
    } catch (error) {
      logger.error({ err: error }, 'Error checking user token validity');
      return true; // Fail open en cas d'erreur
    }
  }

  /**
   * Nettoie les révocations globales expirées
   * À appeler périodiquement (par exemple, une fois par jour)
   * @param {number} maxAge - Age maximum en ms (défaut: 30 jours)
   * @returns {Promise<number>} Nombre de clés nettoyées
   */
  async cleanupExpiredRevocations(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      const pattern = 'user_revoked:*';
      const keys = await this.redis.keys(pattern);
      const now = Date.now();
      let cleaned = 0;

      for (const key of keys) {
        const timestamp = await this.redis.get(key);
        if (timestamp && (now - parseInt(timestamp)) > maxAge) {
          await this.redis.del(key);
          cleaned++;
        }
      }

      logger.info({ cleaned, total: keys.length }, 'Cleaned expired revocations');
      return cleaned;
    } catch (error) {
      logger.error({ err: error }, 'Error cleaning expired revocations');
      return 0;
    }
  }

  /**
   * Ferme la connexion Redis proprement
   * @returns {Promise<void>}
   */
  async close() {
    await this.redis.quit();
    logger.info('TokenService Redis connection closed');
  }
}

// Instance singleton
let tokenServiceInstance = null;

/**
 * Récupère ou crée l'instance singleton du TokenService
 * @returns {TokenService}
 */
function getTokenService() {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new TokenService();
  }
  return tokenServiceInstance;
}

module.exports = {
  TokenService,
  getTokenService
};
