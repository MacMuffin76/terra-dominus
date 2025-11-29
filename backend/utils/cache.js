const Redis = require('ioredis');
const { getLogger } = require('./logger');

const logger = getLogger({ module: 'CacheService' });

let redisClient = null;

/**
 * Initialize Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });

    redisClient.on('connect', () => {
      logger.info('Redis cache connected');
    });
  }

  return redisClient;
}

/**
 * Cache wrapper with TTL
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<any>} Cached or fetched data
 */
async function cacheWrapper(key, ttl, fetchFn) {
  const redis = getRedisClient();

  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      logger.debug({ key }, 'Cache hit');
      return JSON.parse(cached);
    }

    logger.debug({ key }, 'Cache miss');
    
    // Fetch data
    const data = await fetchFn();
    
    // Store in cache
    if (data !== null && data !== undefined) {
      await redis.setex(key, ttl, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    logger.error({ err: error, key }, 'Cache error, falling back to direct fetch');
    // Fallback to direct fetch on cache error
    return fetchFn();
  }
}

/**
 * Invalidate cache by key or pattern
 * @param {string} keyOrPattern - Key or pattern (e.g., 'world:*')
 */
async function invalidateCache(keyOrPattern) {
  const redis = getRedisClient();

  try {
    if (keyOrPattern.includes('*')) {
      // Pattern-based deletion
      const keys = await redis.keys(keyOrPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info({ pattern: keyOrPattern, count: keys.length }, 'Cache invalidated by pattern');
      }
    } else {
      // Single key deletion
      await redis.del(keyOrPattern);
      logger.debug({ key: keyOrPattern }, 'Cache key deleted');
    }
  } catch (error) {
    logger.error({ err: error, keyOrPattern }, 'Cache invalidation error');
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const redis = getRedisClient();

  try {
    const info = await redis.info('stats');
    const keyspace = await redis.info('keyspace');
    
    return {
      info,
      keyspace,
      connected: redis.status === 'ready'
    };
  } catch (error) {
    logger.error({ err: error }, 'Error getting cache stats');
    return { connected: false };
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
async function closeCache() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis cache connection closed');
  }
}

module.exports = {
  cacheWrapper,
  invalidateCache,
  getCacheStats,
  closeCache,
  getRedisClient
};
