/**
 * Achievement Checker Service
 * 
 * Ce service détecte automatiquement les achievements débloqués
 * en fonction des actions des joueurs dans le jeu.
 * 
 * Appelé après les actions importantes pour vérifier si de nouveaux
 * achievements ont été débloqués.
 */

const { logger } = require('./logger');
const NotificationService = require('./notificationService');
const { OBJECTIVE_TYPES } = require('../modules/achievement/domain/achievementRules');

class AchievementCheckerService {
  /**
   * Check achievements after combat
   * Called after a combat is resolved
   */
  async checkCombatAchievements(userId, combatResult) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlockedAchievements = [];

      // Increment battles won or lost
      if (combatResult.outcome === 'attacker_victory') {
        const unlocked = await achievementService.incrementAchievementProgress(
          userId,
          OBJECTIVE_TYPES.TOTAL_BATTLES_WON,
          1
        );
        unlockedAchievements.push(...unlocked);
      } else if (combatResult.outcome === 'defender_victory' || combatResult.outcome === 'attacker_defeated') {
        const unlocked = await achievementService.incrementAchievementProgress(
          userId,
          OBJECTIVE_TYPES.TOTAL_BATTLES_LOST,
          1
        );
        unlockedAchievements.push(...unlocked);
      }

      // Track units killed
      if (combatResult.defenderLosses) {
        const totalUnitsKilled = Object.values(combatResult.defenderLosses).reduce((sum, val) => sum + val, 0);
        if (totalUnitsKilled > 0) {
          const unlocked = await achievementService.incrementAchievementProgress(
            userId,
            OBJECTIVE_TYPES.TOTAL_UNITS_KILLED,
            totalUnitsKilled
          );
          unlockedAchievements.push(...unlocked);
        }
      }

      if (unlockedAchievements.length > 0) {
        logger.info(`User ${userId} unlocked ${unlockedAchievements.length} achievements from combat`);
        
        // Send notifications for each unlocked achievement
        unlockedAchievements.forEach(unlocked => {
          NotificationService.notifyAchievementUnlocked(userId, unlocked.achievement);
        });
      }

      return unlockedAchievements;
    } catch (error) {
      logger.error(`Failed to check combat achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after building upgrade
   * Called when a building construction/upgrade is completed
   */
  async checkBuildingAchievements(userId, building) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlockedAchievements = [];

      // Increment total buildings upgraded
      const upgradedUnlocked = await achievementService.incrementAchievementProgress(
        userId,
        OBJECTIVE_TYPES.TOTAL_BUILDINGS_UPGRADED,
        1
      );
      unlockedAchievements.push(...upgradedUnlocked);

      // Track max building level
      if (building.level) {
        const levelUnlocked = await achievementService.trackAchievementObjective(
          userId,
          OBJECTIVE_TYPES.MAX_BUILDING_LEVEL,
          building.level
        );
        unlockedAchievements.push(...levelUnlocked);
      }

      if (unlockedAchievements.length > 0) {
        logger.info(`User ${userId} unlocked ${unlockedAchievements.length} achievements from building`);
        
        // Send notifications for each unlocked achievement
        unlockedAchievements.forEach(unlocked => {
          NotificationService.notifyAchievementUnlocked(userId, unlocked.achievement);
        });
      }

      return unlockedAchievements;
    } catch (error) {
      logger.error(`Failed to check building achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after quest completion
   * Called when a quest is completed
   */
  async checkQuestAchievements(userId) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlocked = await achievementService.incrementAchievementProgress(
        userId,
        OBJECTIVE_TYPES.TOTAL_QUESTS_COMPLETED,
        1
      );

      if (unlocked.length > 0) {
        logger.info(`User ${userId} unlocked ${unlocked.length} achievements from quest completion`);
        
        // Send notifications for each unlocked achievement
        unlocked.forEach(unlockedAch => {
          NotificationService.notifyAchievementUnlocked(userId, unlockedAch.achievement);
        });
      }

      return unlocked;
    } catch (error) {
      logger.error(`Failed to check quest achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after research completion
   * Called when research is completed
   */
  async checkResearchAchievements(userId) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlocked = await achievementService.incrementAchievementProgress(
        userId,
        OBJECTIVE_TYPES.TOTAL_RESEARCH_COMPLETED,
        1
      );

      if (unlocked.length > 0) {
        logger.info(`User ${userId} unlocked ${unlocked.length} achievements from research`);
        
        // Send notifications for each unlocked achievement
        unlocked.forEach(unlockedAch => {
          NotificationService.notifyAchievementUnlocked(userId, unlockedAch.achievement);
        });
      }

      return unlocked;
    } catch (error) {
      logger.error(`Failed to check research achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after level up
   * Called when a player levels up
   */
  async checkLevelAchievements(userId, newLevel) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlocked = await achievementService.trackAchievementObjective(
        userId,
        OBJECTIVE_TYPES.PLAYER_LEVEL,
        newLevel
      );

      if (unlocked.length > 0) {
        logger.info(`User ${userId} unlocked ${unlocked.length} achievements from level up`);
        
        // Send notifications for each unlocked achievement
        unlocked.forEach(unlockedAch => {
          NotificationService.notifyAchievementUnlocked(userId, unlockedAch.achievement);
        });
      }

      return unlocked;
    } catch (error) {
      logger.error(`Failed to check level achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after resource collection
   * Called when resources are collected
   */
  async checkResourceAchievements(userId, resourceType, amount) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      // Map resource type to objective type
      const objectiveTypeMap = {
        'gold': OBJECTIVE_TYPES.TOTAL_GOLD_COLLECTED,
        'or': OBJECTIVE_TYPES.TOTAL_GOLD_COLLECTED,
        'metal': OBJECTIVE_TYPES.TOTAL_METAL_COLLECTED,
        'fuel': OBJECTIVE_TYPES.TOTAL_FUEL_COLLECTED,
        'carburant': OBJECTIVE_TYPES.TOTAL_FUEL_COLLECTED
      };

      const objectiveType = objectiveTypeMap[resourceType.toLowerCase()];
      if (!objectiveType) {
        logger.warn(`Unknown resource type for achievements: ${resourceType}`);
        return [];
      }

      const unlocked = await achievementService.incrementAchievementProgress(
        userId,
        objectiveType,
        amount
      );

      if (unlocked.length > 0) {
        logger.info(`User ${userId} unlocked ${unlocked.length} achievements from resource collection`);
        
        // Send notifications for each unlocked achievement
        unlocked.forEach(unlockedAch => {
          NotificationService.notifyAchievementUnlocked(userId, unlockedAch.achievement);
        });
      }

      return unlocked;
    } catch (error) {
      logger.error(`Failed to check resource achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check achievements after trade completion
   * Called when a market trade is executed
   */
  async checkTradeAchievements(userId) {
    try {
      const { Achievement, UserAchievement, User, sequelize } = require('../models');
      const AchievementService = require('../modules/achievement/application/AchievementService');
      const AchievementRepository = require('../modules/achievement/infra/SequelizeAchievementRepository');
      const achievementRepository = new AchievementRepository({ Achievement, UserAchievement, User, sequelize });
      const achievementService = new AchievementService({ achievementRepository });

      const unlocked = await achievementService.incrementAchievementProgress(
        userId,
        OBJECTIVE_TYPES.TOTAL_TRADES_COMPLETED,
        1
      );

      if (unlocked.length > 0) {
        logger.info(`User ${userId} unlocked ${unlocked.length} achievements from trade`);
        
        // Send notifications for each unlocked achievement
        unlocked.forEach(unlockedAch => {
          NotificationService.notifyAchievementUnlocked(userId, unlockedAch.achievement);
        });
      }

      return unlocked;
    } catch (error) {
      logger.error(`Failed to check trade achievements for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Recalculate all achievements for a user
   * WARNING: This is an expensive operation - use sparingly
   * Useful for data migrations or fixing corrupted progress
   */
  async recalculateUserAchievements(userId) {
    try {
      const { City, Building, Research, Quest, Attack, MarketTransaction, User } = require('../models');
      const { Op } = require('sequelize');

      logger.info(`Starting achievement recalculation for user ${userId}`);

      // Get user data
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get cities for building/unit queries
      const cities = await City.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });
      const cityIds = cities.map(c => c.id);

      // Recalculate building achievements
      if (cityIds.length > 0) {
        const buildings = await Building.findAll({
          where: { city_id: cityIds }
        });

        const buildingCount = buildings.length;
        const maxBuildingLevel = buildings.reduce((max, b) => Math.max(max, b.level || 0), 0);

        await this.checkBuildingAchievements(userId, { level: maxBuildingLevel });
        
        // Note: TOTAL_BUILDINGS_UPGRADED would need construction history
        logger.warn('TOTAL_BUILDINGS_UPGRADED cannot be recalculated without construction history');
      }

      // Recalculate research achievements
      const researches = await Research.findAll({
        where: { user_id: userId }
      });
      // Note: TOTAL_RESEARCH_COMPLETED would need research history
      logger.warn('TOTAL_RESEARCH_COMPLETED cannot be recalculated without research history');

      // Recalculate combat achievements
      const wonBattles = await Attack.count({
        where: {
          attacker_user_id: userId,
          status: 'completed',
          result: 'attacker_victory'
        }
      });

      const lostBattles = await Attack.count({
        where: {
          attacker_user_id: userId,
          status: 'completed',
          result: { [Op.in]: ['defender_victory', 'attacker_defeated'] }
        }
      });

      // Note: Would need to replay combat results to get exact numbers
      logger.warn('Combat achievements can only be partially recalculated from historical data');

      // Recalculate trade achievements
      const tradeCount = await MarketTransaction.count({
        where: {
          [Op.or]: [
            { buyer_id: userId },
            { seller_id: userId }
          ]
        }
      });
      // Note: TOTAL_TRADES_COMPLETED would need transaction history tracking
      logger.warn('TOTAL_TRADES_COMPLETED cannot be recalculated without transaction history');

      // Check level achievements
      await this.checkLevelAchievements(userId, user.level);

      logger.info(`Achievement recalculation completed for user ${userId}`);
      logger.warn('Note: Some achievements require action history and cannot be fully recalculated');
      
      return {
        success: true,
        message: 'Recalculation completed with limitations - see logs for details'
      };
    } catch (error) {
      logger.error(`Failed to recalculate achievements for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new AchievementCheckerService();
