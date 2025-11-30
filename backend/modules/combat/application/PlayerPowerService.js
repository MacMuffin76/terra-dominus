/**
 * Player Power Service
 * Calculates and caches player power levels for PvP matchmaking
 */

const { calculatePlayerPower } = require('../domain/pvpBalancingRules');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger({ module: 'player-power' });

class PlayerPowerService {
  constructor({ cityRepository, userRepository }) {
    this.cityRepository = cityRepository;
    this.userRepository = userRepository;
    this.powerCache = new Map(); // In-memory cache (could use Redis later)
    this.CACHE_TTL = 300000; // 5 minutes
  }

  /**
   * Get player's total power with caching
   * @param {number} userId - User ID
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<number>} - Power score
   */
  async getPlayerPower(userId, forceRefresh = false) {
    const cacheKey = `power:${userId}`;
    
    // Check cache
    if (!forceRefresh && this.powerCache.has(cacheKey)) {
      const cached = this.powerCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.power;
      }
    }

    // Calculate power
    const power = await this.calculatePower(userId);

    // Store in cache
    this.powerCache.set(cacheKey, {
      power,
      timestamp: Date.now(),
    });

    return power;
  }

  /**
   * Calculate player power from database
   * @param {number} userId - User ID
   * @returns {Promise<number>} - Power score
   */
  async calculatePower(userId) {
    try {
      // Get user data
      const user = await this.userRepository.findById(userId);
      if (!user) return 0;

      // Get all cities
      const cities = await this.cityRepository.findByUserId(userId);

      // Calculate total units across all cities
      const totalUnits = {};
      cities.forEach(city => {
        if (city.units) {
          Object.entries(city.units).forEach(([unitType, count]) => {
            totalUnits[unitType] = (totalUnits[unitType] || 0) + count;
          });
        }
      });

      // Calculate total resources
      const totalResources = {
        gold: user.gold || 0,
        metal: 0,
        fuel: 0,
      };

      cities.forEach(city => {
        totalResources.metal += city.metal || 0;
        totalResources.fuel += city.carburant || 0;
      });

      // Use domain rule to calculate power
      const power = calculatePlayerPower(user, cities, totalUnits, totalResources);

      logger.info({ userId, power, cityCount: cities.length }, 'Calculated player power');

      return power;
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Failed to calculate player power');
      return 0;
    }
  }

  /**
   * Get power for multiple players
   * @param {Array<number>} userIds - Array of user IDs
   * @returns {Promise<Object>} - Map of userId => power
   */
  async getMultiplePlayerPowers(userIds) {
    const powers = {};

    await Promise.all(
      userIds.map(async (userId) => {
        powers[userId] = await this.getPlayerPower(userId);
      })
    );

    return powers;
  }

  /**
   * Invalidate cache for a user (call after significant changes)
   * @param {number} userId - User ID
   */
  invalidateCache(userId) {
    const cacheKey = `power:${userId}`;
    this.powerCache.delete(cacheKey);
    logger.debug({ userId }, 'Power cache invalidated');
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.powerCache.clear();
    logger.info('Power cache cleared');
  }

  /**
   * Get power breakdown for detailed analysis
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Detailed power breakdown
   */
  async getPowerBreakdown(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cities = await this.cityRepository.findByUserId(userId);

    let cityPower = cities.length * 1000;
    let buildingPower = 0;
    let unitPower = 0;
    let resourcePower = 0;

    const unitPowerValues = {
      infantry: 10,
      cavalry: 25,
      archers: 15,
      siege: 50,
      tanks: 80,
      artillery: 60,
      mechs: 150,
      eliteSoldiers: 40,
    };

    const totalUnits = {};
    cities.forEach(city => {
      // Buildings
      buildingPower += (city.metal_mine_level || 0) * 50;
      buildingPower += (city.gold_mine_level || 0) * 50;
      buildingPower += (city.fuel_depot_level || 0) * 50;
      buildingPower += (city.barracks_level || 0) * 100;
      buildingPower += (city.factory_level || 0) * 100;
      buildingPower += (city.research_lab_level || 0) * 150;

      // Units
      if (city.units) {
        Object.entries(city.units).forEach(([unitType, count]) => {
          totalUnits[unitType] = (totalUnits[unitType] || 0) + count;
          const power = unitPowerValues[unitType] || 10;
          unitPower += count * power;
        });
      }

      // Resources
      resourcePower += (city.metal || 0) * 0.03;
      resourcePower += (city.carburant || 0) * 0.02;
    });

    resourcePower += (user.gold || 0) * 0.05;

    const totalPower = cityPower + buildingPower + unitPower + Math.floor(resourcePower);

    return {
      userId,
      totalPower,
      breakdown: {
        cities: {
          count: cities.length,
          power: cityPower,
          percentage: ((cityPower / totalPower) * 100).toFixed(1) + '%',
        },
        buildings: {
          power: buildingPower,
          percentage: ((buildingPower / totalPower) * 100).toFixed(1) + '%',
        },
        units: {
          power: unitPower,
          count: Object.values(totalUnits).reduce((sum, count) => sum + count, 0),
          breakdown: totalUnits,
          percentage: ((unitPower / totalPower) * 100).toFixed(1) + '%',
        },
        resources: {
          power: Math.floor(resourcePower),
          percentage: ((resourcePower / totalPower) * 100).toFixed(1) + '%',
        },
      },
    };
  }
}

module.exports = PlayerPowerService;
