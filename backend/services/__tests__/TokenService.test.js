const { getTokenService } = require('../TokenService');
const jwt = require('jsonwebtoken');

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    setex: jest.fn().mockResolvedValue('OK'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock jwtConfig
jest.mock('../../config/jwtConfig', () => ({
  getJwtSecret: () => 'test-secret-key',
}));

describe('TokenService', () => {
  let tokenService;
  let mockRedis;
  const Redis = require('ioredis');

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService = getTokenService();
    mockRedis = new Redis();
  });

  afterEach(() => {
    if (tokenService && tokenService.disconnect) {
      tokenService.disconnect();
    }
  });

  describe('revokeToken', () => {
    it('devrait ajouter un token à la blacklist avec TTL correct', async () => {
      const token = jwt.sign({ id: 1, iat: Math.floor(Date.now() / 1000) }, 'test-secret-key', { expiresIn: '1h' });
      
      await tokenService.revokeToken(token);

      expect(mockRedis.setex).toHaveBeenCalled();
      const [[key, ttl, value]] = mockRedis.setex.mock.calls;
      expect(key).toBe(`blacklist:${token}`);
      expect(ttl).toBeGreaterThan(0);
      expect(value).toBe('1');
    });

    it('devrait ne rien faire si le token n\'a pas d\'expiration', async () => {
      const token = jwt.sign({ id: 1 }, 'test-secret-key');
      
      await tokenService.revokeToken(token);

      // Ne devrait pas appeler setex car pas d'expiration
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('ne devrait pas lancer d\'erreur pour un token invalide mais logger', async () => {
      const invalidToken = 'invalid.token.here';
      
      // Ne devrait pas rejeter mais juste ne rien faire
      await expect(tokenService.revokeToken(invalidToken)).resolves.toBeUndefined();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('devrait retourner true si le token est dans la blacklist', async () => {
      const token = 'test.token.value';
      mockRedis.exists.mockResolvedValueOnce(1);

      const result = await tokenService.isTokenBlacklisted(token);

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(`blacklist:${token}`);
    });

    it('devrait retourner false si le token n\'est pas dans la blacklist', async () => {
      const token = 'test.token.value';
      mockRedis.exists.mockResolvedValueOnce(0);

      const result = await tokenService.isTokenBlacklisted(token);

      expect(result).toBe(false);
    });

    it('devrait retourner false en cas d\'erreur Redis', async () => {
      const token = 'test.token.value';
      mockRedis.exists.mockRejectedValueOnce(new Error('Redis error'));

      const result = await tokenService.isTokenBlacklisted(token);

      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('devrait ajouter userId à la révocation globale avec timestamp', async () => {
      const userId = 123;
      const timestamp = Math.floor(Date.now() / 1000); // En secondes

      await tokenService.revokeAllUserTokens(userId);

      expect(mockRedis.set).toHaveBeenCalledWith(
        `user_revoked:${userId}`,
        expect.any(Number)
      );

      const [[, value]] = mockRedis.set.mock.calls;
      expect(value).toBeGreaterThanOrEqual(timestamp);
    });
  });

  describe('isTokenValidForUser', () => {
    it('devrait retourner true si aucune révocation globale', async () => {
      const decoded = { id: 123, iat: Math.floor(Date.now() / 1000) };
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await tokenService.isTokenValidForUser(decoded);

      expect(result).toBe(true);
    });

    it('devrait retourner false si le token est antérieur à la révocation globale', async () => {
      const tokenIat = Math.floor(Date.now() / 1000) - 3600; // 1 heure avant
      const revokedAt = Math.floor(Date.now() / 1000) - 1800; // 30 min avant
      const decoded = { id: 123, iat: tokenIat };
      
      mockRedis.get.mockResolvedValueOnce(revokedAt.toString());

      const result = await tokenService.isTokenValidForUser(decoded);

      expect(result).toBe(false);
    });

    it('devrait retourner true si le token est postérieur à la révocation globale', async () => {
      const tokenIat = Math.floor(Date.now() / 1000);
      const revokedAt = Math.floor(Date.now() / 1000) - 3600; // 1 heure avant
      const decoded = { id: 123, iat: tokenIat };
      
      mockRedis.get.mockResolvedValueOnce(revokedAt.toString());

      const result = await tokenService.isTokenValidForUser(decoded);

      expect(result).toBe(true);
    });

    it('devrait retourner true en cas d\'erreur Redis', async () => {
      const decoded = { id: 123, iat: Math.floor(Date.now() / 1000) };
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await tokenService.isTokenValidForUser(decoded);

      expect(result).toBe(true); // Fail-open en cas d'erreur
    });
  });

  describe('rotateRefreshToken', () => {
    it('devrait révoquer l\'ancien token et retourner de nouveaux tokens', async () => {
      const oldToken = jwt.sign({ id: 1, type: 'refresh', iat: Math.floor(Date.now() / 1000) - 100 }, 'test-secret-key', { expiresIn: '7d', noTimestamp: true });
      mockRedis.exists.mockResolvedValueOnce(0); // Token pas blacklisté
      
      const result = await tokenService.rotateRefreshToken(oldToken);

      expect(mockRedis.setex).toHaveBeenCalled(); // Ancien token révoqué
      expect(result).toBeTruthy();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.refreshToken).not.toBe(oldToken);

      const decoded = jwt.decode(result.accessToken);
      expect(decoded.id).toBe(1);
    });

    it('devrait lancer une erreur si l\'ancien token est invalide', async () => {
      const invalidToken = 'invalid.token.here';
      
      await expect(tokenService.rotateRefreshToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('cleanupExpiredRevocations', () => {
    it('devrait supprimer les révocations expirées', async () => {
      const now = Date.now();
      const maxAge = 3600000; // 1 heure
      
      mockRedis.keys.mockResolvedValueOnce([
        'user_revoked:1',
        'user_revoked:2',
        'user_revoked:3',
      ]);

      mockRedis.get
        .mockResolvedValueOnce((now - 7200000).toString()) // Expiré (2h avant)
        .mockResolvedValueOnce((now - 1800000).toString()) // Valide (30min avant)
        .mockResolvedValueOnce((now - 5400000).toString()); // Expiré (1.5h avant)

      const result = await tokenService.cleanupExpiredRevocations(maxAge);

      expect(result).toBe(2); // 2 révocations expirées supprimées
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('user_revoked:1');
      expect(mockRedis.del).toHaveBeenCalledWith('user_revoked:3');
    });

    it('devrait utiliser maxAge par défaut de 30 jours', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);

      await tokenService.cleanupExpiredRevocations();

      expect(mockRedis.keys).toHaveBeenCalledWith('user_revoked:*');
    });
  });

  describe('close', () => {
    it('devrait fermer la connexion Redis proprement', async () => {
      await tokenService.close();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
