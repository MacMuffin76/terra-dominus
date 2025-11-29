/**
 * Tests pour Cache Service
 * Note: Tests de structure uniquement - les tests d'intégration nécessitent Redis
 */

describe('Cache Service', () => {
  describe('cacheWrapper', () => {
    it('should be a function', () => {
      const { cacheWrapper } = require('../cache');
      expect(typeof cacheWrapper).toBe('function');
      expect(cacheWrapper.length).toBe(3); // key, ttl, fetchFn
    });
  });

  describe('invalidateCache', () => {
    it('should be a function', () => {
      const { invalidateCache } = require('../cache');
      expect(typeof invalidateCache).toBe('function');
      expect(invalidateCache.length).toBe(1); // keyOrPattern
    });
  });

  describe('getCacheStats', () => {
    it('should be a function', () => {
      const { getCacheStats } = require('../cache');
      expect(typeof getCacheStats).toBe('function');
    });
  });

  describe('closeCache', () => {
    it('should be a function', () => {
      const { closeCache } = require('../cache');
      expect(typeof closeCache).toBe('function');
    });
  });

  describe('getRedisClient', () => {
    it('should be a function', () => {
      const { getRedisClient } = require('../cache');
      expect(typeof getRedisClient).toBe('function');
    });
  });
});
