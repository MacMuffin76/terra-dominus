const leaderboardService = require('../modules/leaderboard/application/LeaderboardService');
const { logger } = require('./logger');
const { User, Building, Research, Unit, MarketTransaction, Attack } = require('../models');
const { Op } = require('sequelize');

/**
 * Service helper pour mettre à jour automatiquement les scores des leaderboards
 * Appelé par les différents modules du jeu lors des actions des joueurs
 */
class LeaderboardIntegrationService {
  /**
   * Met à jour le score de puissance totale d'un utilisateur
   * Calcule: Somme des niveaux de bâtiments + nombre d'unités × leur puissance
   * @param {number} userId - ID de l'utilisateur
   */
  async updateTotalPower(userId) {
    try {
      const { City } = require('../models');
      
      // Récupérer les cities de l'utilisateur
      const cities = await City.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });
      
      const cityIds = cities.map(c => c.id);
      
      // Récupérer les buildings de toutes les cities
      let buildingPower = 0;
      if (cityIds.length > 0) {
        const buildings = await Building.findAll({
          where: { city_id: cityIds },
          attributes: ['level']
        });
        
        buildingPower = buildings.reduce((sum, building) => {
          return sum + (building.level || 0) * 100; // Chaque niveau = 100 points
        }, 0);
      }

      // Calculer la puissance des unités (via cities aussi)
      let unitPower = 0;
      if (cityIds.length > 0) {
        const units = await Unit.findAll({
          where: { city_id: cityIds }
        });
        
        unitPower = units.reduce((sum, unit) => {
          const unitPowerMap = {
            Infantry: 10,
            Tank: 50,
            Aircraft: 100
          };
          return sum + (unit.quantity || 0) * (unitPowerMap[unit.type] || 10);
        }, 0);
      }

      const totalPower = buildingPower + unitPower;
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.TOTAL_POWER,
        totalPower
      );

      logger.info(`Updated total power for user ${userId}: ${totalPower}`);
    } catch (error) {
      logger.error(`Error updating total power for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le score de bâtiments
   * Calcule: Somme des niveaux de tous les bâtiments
   * @param {number} userId - ID de l'utilisateur
   */
  async updateBuildingsScore(userId) {
    try {
      const { City } = require('../models');
      
      const cities = await City.findAll({
        where: { user_id: userId },
        attributes: ['id']
      });
      
      const cityIds = cities.map(c => c.id);
      
      let totalLevels = 0;
      if (cityIds.length > 0) {
        const buildings = await Building.findAll({
          where: { city_id: cityIds },
          attributes: ['level']
        });
        
        totalLevels = buildings.reduce((sum, building) => {
          return sum + (building.level || 0);
        }, 0);
      }
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.BUILDINGS,
        totalLevels
      );

      logger.info(`Updated buildings score for user ${userId}: ${totalLevels}`);
    } catch (error) {
      logger.error(`Error updating buildings score for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le score de recherche
   * Calcule: Somme des niveaux de toutes les recherches
   * @param {number} userId - ID de l'utilisateur
   */
  async updateResearchScore(userId) {
    try {
      const researches = await Research.findAll({
        where: { user_id: userId }
      });
      
      const totalLevels = researches.reduce((sum, research) => {
        return sum + (research.level || 0);
      }, 0);
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.RESEARCH,
        totalLevels
      );

      logger.info(`Updated research score for user ${userId}: ${totalLevels}`);
    } catch (error) {
      logger.error(`Error updating research score for user ${userId}:`, error);
    }
  }

  /**
   * Incrémente le score de victoires en combat
   * @param {number} userId - ID de l'utilisateur
   * @param {number} victories - Nombre de victoires à ajouter (défaut: 1)
   */
  async incrementCombatVictories(userId, victories = 1) {
    try {
      await leaderboardService.incrementScore(
        userId,
        leaderboardService.CATEGORIES.COMBAT_VICTORIES,
        victories
      );

      logger.info(`Incremented combat victories for user ${userId}: +${victories}`);
    } catch (error) {
      logger.error(`Error incrementing combat victories for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le score d'économie (volume d'échanges)
   * Calcule: Somme du total_price de toutes les transactions où l'utilisateur est acheteur ou vendeur
   * @param {number} userId - ID de l'utilisateur
   */
  async updateEconomyScore(userId) {
    try {
      const transactions = await MarketTransaction.findAll({
        where: {
          [Op.or]: [
            { buyer_id: userId },
            { seller_id: userId }
          ]
        }
      });
      
      const totalVolume = transactions.reduce((sum, tx) => {
        return sum + parseFloat(tx.total_price || 0);
      }, 0);
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.ECONOMY,
        Math.floor(totalVolume)
      );

      logger.info(`Updated economy score for user ${userId}: ${totalVolume}`);
    } catch (error) {
      logger.error(`Error updating economy score for user ${userId}:`, error);
    }
  }

  /**
   * Incrémente le score de production de ressources
   * @param {number} userId - ID de l'utilisateur
   * @param {number} amount - Montant de ressources produites
   */
  async incrementResourcesProduced(userId, amount) {
    try {
      await leaderboardService.incrementScore(
        userId,
        leaderboardService.CATEGORIES.RESOURCES,
        amount
      );

      logger.info(`Incremented resources produced for user ${userId}: +${amount}`);
    } catch (error) {
      logger.error(`Error incrementing resources for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le score d'achievements
   * Calcule: Nombre total d'achievements débloqués
   * @param {number} userId - ID de l'utilisateur
   */
  async updateAchievementsScore(userId) {
    try {
      const { UserAchievement } = require('../models');
      
      const count = await UserAchievement.count({
        where: { user_id: userId }
      });
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.ACHIEVEMENTS,
        count
      );

      logger.info(`Updated achievements score for user ${userId}: ${count}`);
    } catch (error) {
      logger.error(`Error updating achievements score for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le score du Battle Pass
   * Basé sur: current_tier * 1000 + current_xp
   * @param {number} userId - ID de l'utilisateur
   */
  async updateBattlePassScore(userId) {
    try {
      const { UserBattlePass, BattlePassSeason } = require('../models');
      
      // Récupérer la saison active
      const activeSeason = await BattlePassSeason.findOne({
        where: { is_active: true }
      });

      if (!activeSeason) {
        return; // Pas de saison active
      }

      // Récupérer la progression de l'utilisateur
      const userProgress = await UserBattlePass.findOne({
        where: {
          user_id: userId,
          season_id: activeSeason.id
        }
      });

      if (!userProgress) {
        return; // Utilisateur pas encore dans le battle pass
      }

      // Score = tier × 1000 + XP (pour départager à tier égal)
      const score = userProgress.current_tier * 1000 + userProgress.current_xp;
      
      await leaderboardService.updateScore(
        userId,
        leaderboardService.CATEGORIES.BATTLE_PASS,
        score
      );

      logger.info(`Updated battle pass score for user ${userId}: ${score} (tier ${userProgress.current_tier}, XP ${userProgress.current_xp})`);
    } catch (error) {
      logger.error(`Error updating battle pass score for user ${userId}:`, error);
    }
  }

  /**
   * Incrémente le score de portails complétés
   * @param {number} userId - ID de l'utilisateur
   * @param {number} portals - Nombre de portails complétés (défaut: 1)
   */
  async incrementPortalsCompleted(userId, portals = 1) {
    try {
      await leaderboardService.incrementScore(
        userId,
        leaderboardService.CATEGORIES.PORTALS,
        portals
      );

      logger.info(`Incremented portals completed for user ${userId}: +${portals}`);
    } catch (error) {
      logger.error(`Error incrementing portals for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour tous les scores d'un utilisateur (utile pour la première initialisation)
   * @param {number} userId - ID de l'utilisateur
   */
  async updateAllScores(userId) {
    try {
      logger.info(`Updating all leaderboard scores for user ${userId}`);
      
      await Promise.all([
        this.updateTotalPower(userId),
        this.updateBuildingsScore(userId),
        this.updateResearchScore(userId),
        this.updateEconomyScore(userId),
        this.updateAchievementsScore(userId),
        this.updateBattlePassScore(userId)
        // Note: combat_victories, resources, portals sont des compteurs incrémentaux
        // donc pas besoin de les recalculer depuis zéro
      ]);

      logger.info(`All leaderboard scores updated for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating all scores for user ${userId}:`, error);
    }
  }
}

module.exports = new LeaderboardIntegrationService();
