const { FACILITY_DEFINITIONS } = require('../domain/facilityDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * FacilityService - Gestion des installations stratégiques
 * 
 * Système:
 * - Liste des installations disponibles
 * - Calcul des bonus par niveau
 * - Coûts d'amélioration
 */
class FacilityService {
  constructor({ User, Facility, City, sequelize }) {
    this.User = User;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Obtenir toutes les installations du joueur
   * @param {number} userId - ID du joueur
   * @returns {Promise<Array>}
   */
  async getPlayerFacilities(userId) {
    return runWithContext(async () => {
      const user = await this.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Récupérer la ville du joueur
      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      // Récupérer les installations du joueur
      const playerFacilities = await this.Facility.findAll({ 
        where: { city_id: city.id } 
      });

      const facilities = [];

      // Parcourir toutes les définitions d'installations
      for (const [key, facilityDef] of Object.entries(FACILITY_DEFINITIONS)) {
        // Trouver l'installation correspondante du joueur
        const playerFacility = playerFacilities.find(f => 
          f.name === facilityDef.name || 
          f.type === key.toLowerCase()
        );

        const currentLevel = playerFacility?.level || 0;
        const isBuilt = currentLevel > 0;

        // Calculer les bonus actuels
        const currentBonuses = this._calculateBonuses(facilityDef, currentLevel);
        
        // Calculer les bonus au prochain niveau
        const nextBonuses = currentLevel < facilityDef.maxLevel 
          ? this._calculateBonuses(facilityDef, currentLevel + 1)
          : null;

        // Calculer le coût du prochain niveau
        const upgradeCost = currentLevel < facilityDef.maxLevel
          ? this._calculateUpgradeCost(facilityDef, currentLevel + 1)
          : null;

        // Déterminer les unités/défenses/recherches débloquées à ce niveau
        const levelUnlocks = facilityDef.levelUnlocks?.[currentLevel] || [];
        const nextLevelUnlocks = facilityDef.levelUnlocks?.[currentLevel + 1] || [];

        facilities.push({
          id: playerFacility?.id || null,
          key,
          name: facilityDef.name,
          description: facilityDef.description,
          icon: facilityDef.icon,
          category: facilityDef.category,
          currentLevel,
          maxLevel: facilityDef.maxLevel,
          isBuilt,
          isMaxLevel: currentLevel >= facilityDef.maxLevel,
          currentBonuses,
          nextBonuses,
          upgradeCost,
          levelUnlocks,
          nextLevelUnlocks,
          baseStats: facilityDef.baseStats
        });
      }

      return facilities.sort((a, b) => {
        // Tri par catégorie puis par nom
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    });
  }

  /**
   * Obtenir les détails d'une installation spécifique
   * @param {number} userId
   * @param {string} facilityKey - Clé de l'installation (ex: 'TRAINING_CENTER')
   * @returns {Promise<Object>}
   */
  async getFacilityDetails(userId, facilityKey) {
    return runWithContext(async () => {
      const facilityDef = FACILITY_DEFINITIONS[facilityKey.toUpperCase()];
      if (!facilityDef) {
        throw new Error(`Facility ${facilityKey} not found`);
      }

      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      const playerFacility = await this.Facility.findOne({ 
        where: { 
          city_id: city.id,
          name: facilityDef.name
        } 
      });

      const currentLevel = playerFacility?.level || 0;

      // Générer un résumé par niveau (tous les niveaux de 1 à max)
      const levelSummary = [];
      for (let level = 1; level <= facilityDef.maxLevel; level++) {
        levelSummary.push({
          level,
          bonuses: this._calculateBonuses(facilityDef, level),
          cost: this._calculateUpgradeCost(facilityDef, level),
          unlocks: facilityDef.levelUnlocks?.[level] || [],
          isUnlocked: level <= currentLevel
        });
      }

      return {
        id: playerFacility?.id || null,
        key: facilityKey,
        name: facilityDef.name,
        description: facilityDef.description,
        icon: facilityDef.icon,
        category: facilityDef.category,
        currentLevel,
        maxLevel: facilityDef.maxLevel,
        baseStats: facilityDef.baseStats,
        levelSummary
      };
    });
  }

  /**
   * Calculer les bonus d'une installation à un niveau donné
   * @private
   */
  _calculateBonuses(facilityDef, level) {
    if (!facilityDef.bonusPerLevel || level === 0) {
      return {};
    }

    const bonuses = {};
    for (const [bonusKey, bonusPerLevel] of Object.entries(facilityDef.bonusPerLevel)) {
      bonuses[bonusKey] = bonusPerLevel * level;
    }

    return bonuses;
  }

  /**
   * Calculer le coût d'amélioration à un niveau donné
   * @private
   */
  _calculateUpgradeCost(facilityDef, targetLevel) {
    const baseCost = facilityDef.baseCost || { metal: 1000, energy: 500 };
    const multiplier = facilityDef.costMultiplier || 1.5;

    const cost = {};
    for (const [resource, baseAmount] of Object.entries(baseCost)) {
      cost[resource] = Math.floor(baseAmount * Math.pow(multiplier, targetLevel - 1));
    }

    return cost;
  }

  /**
   * Obtenir le résumé des bonus totaux de toutes les installations
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getTotalBonuses(userId) {
    return runWithContext(async () => {
      const facilities = await this.getPlayerFacilities(userId);
      
      const totalBonuses = {};

      for (const facility of facilities) {
        if (facility.currentBonuses) {
          for (const [bonusKey, value] of Object.entries(facility.currentBonuses)) {
            totalBonuses[bonusKey] = (totalBonuses[bonusKey] || 0) + value;
          }
        }
      }

      return {
        facilities: facilities.filter(f => f.isBuilt),
        totalBonuses,
        summary: Object.entries(totalBonuses).map(([key, value]) => ({
          bonus: key,
          value: value,
          formatted: `+${(value * 100).toFixed(1)}%`
        }))
      };
    });
  }
}

module.exports = FacilityService;
