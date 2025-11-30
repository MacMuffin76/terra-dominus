/**
 * PortalService
 * Business logic for portal system
 */

const {
  PORTAL_TIERS,
  ENEMY_TEMPLATES,
  LOOT_TABLES,
  generatePortalEnemies,
  generatePortalLoot,
  calculateTravelTime,
  calculateSurvivors,
  selectRandomTier
} = require('../domain/portalRules');
const { getLogger } = require('../../../utils/logger');

const logger = getLogger({ module: 'PortalService' });

class PortalService {
  constructor({ portalRepository, cityRepository }) {
    this.portalRepository = portalRepository;
    this.cityRepository = cityRepository;
  }

  /**
   * Spawn a random portal at random coordinates
   * @param {number} worldSize - Size of the world map (default 1000x1000)
   * @returns {Promise<Portal>}
   */
  async spawnRandomPortal(worldSize = 1000) {
    try {
      // Select random tier
      const tier = selectRandomTier();
      const tierConfig = PORTAL_TIERS[tier];

      // Generate random coordinates (avoid edges)
      const margin = 50;
      const coordX = Math.floor(Math.random() * (worldSize - 2 * margin)) + margin;
      const coordY = Math.floor(Math.random() * (worldSize - 2 * margin)) + margin;

      // Generate power value within tier range
      const [minPower, maxPower] = tierConfig.power_range;
      const power = Math.floor(Math.random() * (maxPower - minPower + 1)) + minPower;

      // Generate enemies
      const enemies = generatePortalEnemies(tier, tierConfig.power_range);

      // Generate loot table
      const lootTable = LOOT_TABLES[tier];

      // Calculate expiration time
      const spawnedAt = new Date();
      const expiresAt = new Date(spawnedAt.getTime() + tierConfig.duration * 60 * 60 * 1000);

      // Create portal
      const portal = await this.portalRepository.createPortal({
        tier,
        coord_x: coordX,
        coord_y: coordY,
        power,
        enemies,
        loot_table: lootTable,
        status: 'active',
        spawned_at: spawnedAt,
        expires_at: expiresAt,
        times_challenged: 0,
        times_cleared: 0
      });

      logger.info('Portal spawned', {
        portalId: portal.id,
        tier: portal.tier,
        coords: { x: coordX, y: coordY },
        power,
        expiresAt
      });

      return portal;
    } catch (error) {
      logger.error('Error spawning portal', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Challenge a portal with units from a city
   * @param {number} userId
   * @param {number} portalId
   * @param {number} cityId
   * @param {Object} units - { Infantry: 50, Tank: 10, ... }
   * @returns {Promise<PortalExpedition>}
   */
  async challengePortal(userId, portalId, cityId, units) {
    try {
      // Validate portal exists and is active
      const portal = await this.portalRepository.getPortalById(portalId);
      if (!portal) {
        throw new Error('Portal not found');
      }
      if (portal.status !== 'active') {
        throw new Error(`Portal is ${portal.status}, cannot be challenged`);
      }
      if (new Date() > portal.expires_at) {
        throw new Error('Portal has expired');
      }

      // Validate city belongs to user and exists
      const city = await this.cityRepository.findById(cityId);
      if (!city) {
        throw new Error('City not found');
      }
      if (city.user_id !== userId) {
        throw new Error('City does not belong to user');
      }

      // Validate units are available in city
      // (This would typically check city.units and subtract units)
      // For now, we'll assume validation happens at controller/API level

      // Calculate travel time
      const distance = Math.sqrt(
        Math.pow(portal.coord_x - city.coord_x, 2) + 
        Math.pow(portal.coord_y - city.coord_y, 2)
      );
      const travelTimeHours = calculateTravelTime(distance);

      // Calculate departure and arrival times
      const departureTime = new Date();
      const arrivalTime = new Date(departureTime.getTime() + travelTimeHours * 60 * 60 * 1000);

      // Create expedition
      const expedition = await this.portalRepository.createExpedition({
        portal_id: portalId,
        user_id: userId,
        city_id: cityId,
        units,
        status: 'traveling',
        departure_time: departureTime,
        arrival_time: arrivalTime,
        resolved_at: null,
        loot_gained: null,
        survivors: null
      });

      // Increment portal challenge count
      await this.portalRepository.incrementChallengeCount(portalId);

      // Schedule expedition resolution job
      const { scheduleExpeditionResolution } = require('../../../jobs/workers/portalWorker');
      await scheduleExpeditionResolution(expedition.id, arrivalTime);

      logger.info('Portal expedition created', {
        expeditionId: expedition.id,
        userId,
        portalId,
        cityId,
        units,
        arrivalTime
      });

      return expedition;
    } catch (error) {
      logger.error('Error challenging portal', { 
        userId, 
        portalId, 
        cityId, 
        units, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Resolve an expedition (combat simulation)
   * @param {number} expeditionId
   * @returns {Promise<Object>} { victory: boolean, survivors: Object, loot: Object }
   */
  async resolveExpedition(expeditionId) {
    try {
      // Fetch expedition with portal data
      const expedition = await this.portalRepository.getExpeditionById(expeditionId);
      if (!expedition) {
        throw new Error('Expedition not found');
      }
      if (expedition.status !== 'traveling') {
        throw new Error(`Expedition already resolved with status: ${expedition.status}`);
      }

      const portal = expedition.portal;
      if (!portal) {
        throw new Error('Portal not found for expedition');
      }

      // Calculate combat power
      const attackerPower = this.calculateArmyPower(expedition.units);
      const defenderPower = portal.power;

      // Determine victory
      const victory = attackerPower > defenderPower;

      // Calculate survivors
      const survivors = calculateSurvivors(expedition.units, victory);

      // Generate loot if victory
      let loot = null;
      if (victory) {
        loot = generatePortalLoot(portal.tier);
        
        // Mark portal as cleared if victory
        await this.portalRepository.markPortalAsCleared(portal.id);
      }

      // Update expedition status
      const resolvedAt = new Date();
      await this.portalRepository.updateExpedition(expeditionId, {
        status: victory ? 'victory' : 'defeat',
        resolved_at: resolvedAt,
        loot_gained: loot,
        survivors
      });

      logger.info('Expedition resolved', {
        expeditionId,
        victory,
        attackerPower,
        defenderPower,
        survivors,
        loot
      });

      return {
        victory,
        survivors,
        loot,
        attackerPower,
        defenderPower
      };
    } catch (error) {
      logger.error('Error resolving expedition', { 
        expeditionId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Calculate total army power from units
   * @param {Object} units - { Infantry: 50, Tank: 10, ... }
   * @returns {number} Total power
   */
  calculateArmyPower(units) {
    // Unit power values (simplified - should match unitRules.js)
    const unitPower = {
      Infantry: 1,
      Tank: 5,
      Artillery: 4,
      APC: 3,
      Helicopter: 6,
      Fighter: 8
    };

    let totalPower = 0;
    for (const [unitType, count] of Object.entries(units)) {
      const power = unitPower[unitType] || 1;
      totalPower += power * count;
    }

    return totalPower;
  }

  /**
   * Get all active portals
   * @returns {Promise<Portal[]>}
   */
  async getActivePortals() {
    try {
      return await this.portalRepository.getActivePortals();
    } catch (error) {
      logger.error('Error getting active portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Get portals near coordinates
   * @param {number} coordX
   * @param {number} coordY
   * @param {number} radius
   * @returns {Promise<Portal[]>}
   */
  async getPortalsNearCoordinates(coordX, coordY, radius = 50) {
    try {
      return await this.portalRepository.getPortalsNearCoordinates(coordX, coordY, radius);
    } catch (error) {
      logger.error('Error getting portals near coordinates', { coordX, coordY, radius, error: error.message });
      throw error;
    }
  }

  /**
   * Get portal by ID
   * @param {number} portalId
   * @returns {Promise<Portal>}
   */
  async getPortalById(portalId) {
    try {
      const portal = await this.portalRepository.getPortalById(portalId);
      if (!portal) {
        throw new Error('Portal not found');
      }
      return portal;
    } catch (error) {
      logger.error('Error getting portal by ID', { portalId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's expeditions
   * @param {number} userId
   * @param {string} status - Optional status filter
   * @returns {Promise<PortalExpedition[]>}
   */
  async getUserExpeditions(userId, status = null) {
    try {
      return await this.portalRepository.getUserExpeditions(userId, status);
    } catch (error) {
      logger.error('Error getting user expeditions', { userId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Expire old portals (cleanup job)
   * @returns {Promise<number>} Number of expired portals
   */
  async expireOldPortals() {
    try {
      return await this.portalRepository.expireOldPortals();
    } catch (error) {
      logger.error('Error expiring old portals', { error: error.message });
      throw error;
    }
  }

  /**
   * Get portal statistics
   * @returns {Promise<Object>}
   */
  async getPortalStatistics() {
    try {
      const activeCount = await this.portalRepository.countActivePortalsByTier();
      return {
        active_by_tier: activeCount,
        total_active: Object.values(activeCount).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      logger.error('Error getting portal statistics', { error: error.message });
      throw error;
    }
  }
}

module.exports = PortalService;
