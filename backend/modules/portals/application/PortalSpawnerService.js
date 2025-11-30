/**
 * Portal Spawning Service
 * Handles periodic portal generation on the world map
 */

const { getLogger, runWithContext } = require('../../../utils/logger');
const logger = getLogger({ module: 'portal-spawner' });

class PortalSpawnerService {
  constructor({ portalRepository, rewardsConfigRepository }) {
    this.portalRepository = portalRepository;
    this.rewardsConfigRepository = rewardsConfigRepository;
  }

  /**
   * Spawn configuration for each tier
   */
  getSpawnConfig() {
    return {
      grey: {
        frequency: 2 * 60 * 60 * 1000, // 2 hours
        duration: 24 * 60 * 60 * 1000, // 24 hours
        spawnChance: 0.8, // 80% chance
        spawnRadius: { min: 50, max: 200 }, // Distance from player bases
        maxActive: 50, // Max active portals of this tier
      },
      green: {
        frequency: 4 * 60 * 60 * 1000, // 4 hours
        duration: 36 * 60 * 60 * 1000, // 36 hours
        spawnChance: 0.6,
        spawnRadius: { min: 100, max: 300 },
        maxActive: 30,
      },
      blue: {
        frequency: 8 * 60 * 60 * 1000, // 8 hours
        duration: 48 * 60 * 60 * 1000, // 48 hours
        spawnChance: 0.4,
        spawnRadius: { min: 200, max: 500 },
        maxActive: 20,
      },
      purple: {
        frequency: 12 * 60 * 60 * 1000, // 12 hours
        duration: 72 * 60 * 60 * 1000, // 72 hours
        spawnChance: 0.3,
        spawnRadius: { min: 300, max: 700 },
        maxActive: 10,
      },
      red: {
        frequency: 24 * 60 * 60 * 1000, // 24 hours
        duration: 96 * 60 * 60 * 1000, // 96 hours
        spawnChance: 0.2,
        spawnRadius: { min: 500, max: 1000 },
        maxActive: 5,
      },
      golden: {
        frequency: 48 * 60 * 60 * 1000, // 48 hours
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        spawnChance: 0.1,
        spawnRadius: { min: 0, max: 2000 },
        maxActive: 1, // Only one golden portal at a time
        globalEvent: true,
      },
    };
  }

  /**
   * Enemy composition by tier
   */
  getEnemyComposition(tier, difficulty) {
    const compositions = {
      grey: {
        infantry: Math.floor(50 + difficulty * 10),
        scouts: Math.floor(20 + difficulty * 5),
      },
      green: {
        infantry: Math.floor(100 + difficulty * 20),
        raiders: Math.floor(50 + difficulty * 10),
        drones: Math.floor(30 + difficulty * 5),
      },
      blue: {
        infantry: Math.floor(200 + difficulty * 30),
        eliteSoldiers: Math.floor(100 + difficulty * 20),
        tanks: Math.floor(50 + difficulty * 10),
        artillery: Math.floor(20 + difficulty * 5),
      },
      purple: {
        eliteSoldiers: Math.floor(300 + difficulty * 40),
        tanks: Math.floor(150 + difficulty * 25),
        mechs: Math.floor(50 + difficulty * 15),
        commander: 1,
      },
      red: {
        eliteSoldiers: Math.floor(500 + difficulty * 60),
        tanks: Math.floor(250 + difficulty * 40),
        mechs: Math.floor(100 + difficulty * 25),
        siegeUnits: Math.floor(50 + difficulty * 15),
        fieldBoss: 1,
      },
      golden: {
        eliteSoldiers: Math.floor(1000 + difficulty * 100),
        tanks: Math.floor(500 + difficulty * 75),
        mechs: Math.floor(300 + difficulty * 50),
        siegeUnits: Math.floor(150 + difficulty * 30),
        ancientMachines: Math.floor(50 + difficulty * 15),
        legendaryWarlord: 1, // Boss
      },
    };

    return compositions[tier] || compositions.grey;
  }

  /**
   * Calculate recommended power for portal
   */
  calculateRecommendedPower(tier, difficulty) {
    const basePower = {
      grey: 75,
      green: 350,
      blue: 1150,
      purple: 3000,
      red: 6500,
      golden: 15000,
    };

    return Math.floor(basePower[tier] * (1 + difficulty * 0.1));
  }

  /**
   * Generate random coordinates avoiding conflicts
   */
  async generateCoordinates(tier, config) {
    const { min, max } = config.spawnRadius;
    const worldSize = 2000; // World map size

    // Try multiple times to find non-conflicting location
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * (worldSize - min * 2)) + min;
      const y = Math.floor(Math.random() * (worldSize - min * 2)) + min;

      // Check if location is not too close to other active portals
      const nearbyPortals = await this.portalRepository.findNearby(x, y, 50);
      if (nearbyPortals.length === 0) {
        return { x, y };
      }
    }

    // Fallback to random location
    return {
      x: Math.floor(Math.random() * worldSize),
      y: Math.floor(Math.random() * worldSize),
    };
  }

  /**
   * Spawn a portal of specific tier
   */
  async spawnPortal(tier) {
    return runWithContext(async () => {
      try {
        const config = this.getSpawnConfig()[tier];

        // Check spawn chance
        if (Math.random() > config.spawnChance) {
          logger.info(`Portal spawn skipped for tier ${tier} (chance roll failed)`);
          return null;
        }

        // Check max active portals of this tier
        const activeCount = await this.portalRepository.countByTierAndStatus(tier, 'active');
        if (activeCount >= config.maxActive) {
          logger.info(`Portal spawn skipped for tier ${tier} (max active reached: ${activeCount}/${config.maxActive})`);
          return null;
        }

        // Generate coordinates
        const { x, y } = await this.generateCoordinates(tier, config);

        // Random difficulty 1-10
        const difficulty = Math.floor(Math.random() * 10) + 1;

        // Calculate power and enemies
        const recommendedPower = this.calculateRecommendedPower(tier, difficulty);
        const enemyComposition = this.getEnemyComposition(tier, difficulty);

        // Calculate expiry time
        const spawnTime = new Date();
        const expiryTime = new Date(spawnTime.getTime() + config.duration);

        // Create portal
        const portal = await this.portalRepository.create({
          tier,
          x_coordinate: x,
          y_coordinate: y,
          spawn_time: spawnTime,
          expiry_time: expiryTime,
          status: 'active',
          difficulty,
          recommended_power: recommendedPower,
          global_event: config.globalEvent || false,
          enemy_composition: enemyComposition,
        });

        logger.info(`Portal spawned: ${tier} at (${x}, ${y}), power: ${recommendedPower}, difficulty: ${difficulty}`);

        // If golden portal (global event), notify all players
        if (config.globalEvent) {
          // TODO: Emit socket event to all connected users
          logger.info('⭐ GOLDEN PORTAL SPAWNED - Global Event!');
        }

        return portal;
      } catch (error) {
        logger.error(`Failed to spawn portal for tier ${tier}:`, error);
        throw error;
      }
    });
  }

  /**
   * Spawn all tiers (called by cron job)
   */
  async spawnAllTiers() {
    return runWithContext(async () => {
      try {
        logger.info('Starting portal spawn cycle...');

        const tiers = ['grey', 'green', 'blue', 'purple', 'red', 'golden'];
        const results = {
          spawned: [],
          skipped: [],
        };

        for (const tier of tiers) {
          const portal = await this.spawnPortal(tier);
          if (portal) {
            results.spawned.push({ tier, portalId: portal.id });
          } else {
            results.skipped.push(tier);
          }
        }

        logger.info(`Portal spawn cycle complete. Spawned: ${results.spawned.length}, Skipped: ${results.skipped.length}`);
        return results;
      } catch (error) {
        logger.error('Portal spawn cycle failed:', error);
        throw error;
      }
    });
  }

  /**
   * Expire old portals
   */
  async expireOldPortals() {
    return runWithContext(async () => {
      try {
        const now = new Date();
        const expiredCount = await this.portalRepository.expirePortals(now);
        
        if (expiredCount > 0) {
          logger.info(`Expired ${expiredCount} old portals`);
        }

        return expiredCount;
      } catch (error) {
        logger.error('Failed to expire old portals:', error);
        throw error;
      }
    });
  }

  /**
   * Clean up expired portals from database
   */
  async cleanupExpiredPortals(daysOld = 7) {
    return runWithContext(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const deletedCount = await this.portalRepository.deleteExpiredBefore(cutoffDate);
        
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} expired portals older than ${daysOld} days`);
        }

        return deletedCount;
      } catch (error) {
        logger.error('Failed to cleanup expired portals:', error);
        throw error;
      }
    });
  }

  /**
   * Get spawn statistics
   */
  async getSpawnStats() {
    return runWithContext(async () => {
      try {
        const tiers = ['grey', 'green', 'blue', 'purple', 'red', 'golden'];
        const stats = {};

        for (const tier of tiers) {
          const active = await this.portalRepository.countByTierAndStatus(tier, 'active');
          const total = await this.portalRepository.countByTier(tier);
          stats[tier] = { active, total };
        }

        return stats;
      } catch (error) {
        logger.error('Failed to get spawn stats:', error);
        throw error;
      }
    });
  }
}

module.exports = PortalSpawnerService;
