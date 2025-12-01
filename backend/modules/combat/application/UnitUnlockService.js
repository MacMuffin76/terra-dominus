const { UNIT_TIERS, UNIT_DEFINITIONS } = require('../domain/unitDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * UnitUnlockService - Gestion des débloca des unités par bâtiments et recherches
 * 
 * Nouveau système:
 * - Vérification des niveaux de bâtiments (Training Center, Forge)
 * - Vérification des recherches complétées
 * - Liste des unités disponibles pour un joueur
 */
class UnitUnlockService {
  constructor({ User, Research, Building, Facility, City, sequelize }) {
    this.User = User;
    this.Research = Research;
    this.Building = Building;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Obtenir toutes les unités débloquées pour un joueur
   * @param {number} userId - ID du joueur
   * @returns {Promise<{unlocked: Array, locked: Array, nextUnlock: Object}>}
   */
  async getAvailableUnits(userId) {
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

      // Récupérer les bâtiments/facilities du joueur
      const facilities = await this.Facility.findAll({ where: { city_id: city.id } });
      const buildings = await this.Building.findAll({ where: { city_id: city.id } });

      // Récupérer les recherches complétées (level > 0 signifie recherche active/complétée)
      const completedResearch = await this.Research.findAll({
        where: { 
          user_id: userId,
          level: { [this.sequelize.Sequelize.Op.gt]: 0 }
        }
      });

      const researchIds = completedResearch.map(r => r.name);

      // Récupérer niveaux des installations clés
      const trainingCenter = facilities.find(f => f.name === 'Centre d\'Entraînement' || f.name === 'Terrain d\'Entrainement');
      const forge = facilities.find(f => f.name === 'Forge Militaire');
      
      const trainingCenterLevel = trainingCenter?.level || 0;
      const forgeLevel = forge?.level || 0;

      const unlocked = [];
      const locked = [];
      let nextUnlock = null;

      // Parcourir toutes les unités
      for (const unit of Object.values(UNIT_DEFINITIONS)) {
        const checkResult = this._checkUnitRequirements(unit, {
          trainingCenterLevel,
          forgeLevel,
          researchIds
        });

        const unitData = {
          ...unit,
          isUnlocked: checkResult.isUnlocked,
          missingRequirements: checkResult.missingRequirements,
          tierName: Object.values(UNIT_TIERS)[unit.tier - 1]?.name || 'Unknown'
        };

        if (checkResult.isUnlocked) {
          unlocked.push(unitData);
        } else {
          locked.push(unitData);
          
          // Trouver le prochain unlock (par tier)
          if (!nextUnlock || unit.tier < nextUnlock.tier) {
            nextUnlock = {
              ...unitData,
              requirementsText: checkResult.missingRequirements.join(', ')
            };
          }
        }
      }

      return {
        unlocked: unlocked.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
        locked: locked.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
        nextUnlock,
        buildings: {
          trainingCenterLevel,
          forgeLevel
        },
        tierProgress: this._calculateTierProgress(trainingCenterLevel, forgeLevel)
      };
    });
  }

  /**
   * Vérifier si une unité est débloquée pour un joueur
   * @param {number} userId - ID du joueur
   * @param {string} unitId - ID de l'unité (ex: 'riflemen', 'heavy_tank')
   * @returns {Promise<{isUnlocked: boolean, reason: string, missingRequirements: Array}>}
   */
  async checkUnitUnlock(userId, unitId) {
    return runWithContext(async () => {
      const unit = UNIT_DEFINITIONS[unitId.toUpperCase()];
      if (!unit) {
        throw new Error(`Unit ${unitId} not found`);
      }

      // Récupérer la ville du joueur
      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      // Récupérer les bâtiments/facilities du joueur
      const facilities = await this.Facility.findAll({ where: { city_id: city.id } });

      // Récupérer les recherches complétées (level > 0 signifie recherche active/complétée)
      const completedResearch = await this.Research.findAll({
        where: { 
          user_id: userId,
          level: { [this.sequelize.Sequelize.Op.gt]: 0 }
        }
      });

      const researchIds = completedResearch.map(r => r.name);

      // Récupérer niveaux des installations clés
      const trainingCenter = facilities.find(f => f.name === 'Centre d\'Entraînement' || f.name === 'Terrain d\'Entrainement');
      const forge = facilities.find(f => f.name === 'Forge Militaire');
      
      const trainingCenterLevel = trainingCenter?.level || 0;
      const forgeLevel = forge?.level || 0;

      const checkResult = this._checkUnitRequirements(unit, {
        trainingCenterLevel,
        forgeLevel,
        researchIds
      });

      return {
        isUnlocked: checkResult.isUnlocked,
        reason: checkResult.isUnlocked 
          ? 'Unit unlocked' 
          : checkResult.missingRequirements.join(', '),
        missingRequirements: checkResult.missingRequirements,
        unit: {
          id: unit.id,
          name: unit.name,
          tier: unit.tier
        }
      };
    });
  }

  /**
   * Vérifier les prérequis d'une unité
   * @private
   */
  _checkUnitRequirements(unit, playerData) {
    const { trainingCenterLevel, forgeLevel, researchIds } = playerData;
    const missingRequirements = [];
    let isUnlocked = true;

    // Vérifier Training Center
    if (unit.requiredBuildings.trainingCenter) {
      if (trainingCenterLevel < unit.requiredBuildings.trainingCenter) {
        isUnlocked = false;
        missingRequirements.push(
          `Centre d'Entraînement Niv ${unit.requiredBuildings.trainingCenter} (actuellement: ${trainingCenterLevel})`
        );
      }
    }

    // Vérifier Forge
    if (unit.requiredBuildings.forge) {
      if (forgeLevel < unit.requiredBuildings.forge) {
        isUnlocked = false;
        missingRequirements.push(
          `Forge Militaire Niv ${unit.requiredBuildings.forge} (actuellement: ${forgeLevel})`
        );
      }
    }

    // Vérifier recherches
    if (unit.requiredResearch && unit.requiredResearch.length > 0) {
      for (const researchId of unit.requiredResearch) {
        if (!researchIds.includes(researchId)) {
          isUnlocked = false;
          missingRequirements.push(`Recherche: ${researchId}`);
        }
      }
    }

    return {
      isUnlocked,
      missingRequirements
    };
  }

  /**
   * Calculer la progression dans les tiers
   * @param {number} trainingCenterLevel - Niveau Centre d'Entraînement
   * @param {number} forgeLevel - Niveau Forge
   * @returns {Object} - Info de progression
   */
  _calculateTierProgress(trainingCenterLevel, forgeLevel) {
    const tiers = Object.values(UNIT_TIERS);
    
    let currentTier = null;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const meetsRequirements = 
        trainingCenterLevel >= (tier.requiredBuildings.trainingCenter || 0) &&
        (!tier.requiredBuildings.forge || forgeLevel >= tier.requiredBuildings.forge);

      if (meetsRequirements) {
        currentTier = { ...tier, number: i + 1 };
      } else if (!nextTier) {
        nextTier = { ...tier, number: i + 1 };
        break;
      }
    }

    if (!nextTier && currentTier) {
      return {
        currentTier,
        nextTier: null,
        progress: 100,
        message: 'Tous les tiers débloqués!'
      };
    }

    const missingForNext = [];
    if (nextTier) {
      if (trainingCenterLevel < (nextTier.requiredBuildings.trainingCenter || 0)) {
        missingForNext.push(`Centre Niv ${nextTier.requiredBuildings.trainingCenter}`);
      }
      if (nextTier.requiredBuildings.forge && forgeLevel < nextTier.requiredBuildings.forge) {
        missingForNext.push(`Forge Niv ${nextTier.requiredBuildings.forge}`);
      }
    }

    return {
      currentTier: currentTier || { name: 'Aucun', number: 0 },
      nextTier,
      missingForNext,
      message: nextTier ? 
        `Prochain tier: ${nextTier.name} - ${missingForNext.join(', ')}` : 
        'Tous les tiers débloqués!'
    };
  }

  /**
   * Obtenir un résumé des tiers pour l'UI
   * @param {number} trainingCenterLevel
   * @param {number} forgeLevel
   * @returns {Array} - Liste des tiers avec statut
   */
  getTiersSummary(trainingCenterLevel, forgeLevel) {
    return Object.entries(UNIT_TIERS).map(([key, tierInfo], index) => {
      const tierNumber = index + 1;
      const isUnlocked = 
        trainingCenterLevel >= (tierInfo.requiredBuildings.trainingCenter || 0) &&
        (!tierInfo.requiredBuildings.forge || forgeLevel >= tierInfo.requiredBuildings.forge);
      
      const unitsInTier = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tierNumber);

      return {
        tier: tierNumber,
        name: tierInfo.name,
        requiredBuildings: tierInfo.requiredBuildings,
        isUnlocked,
        unitCount: unitsInTier.length,
        units: unitsInTier.map(u => ({
          id: u.id,
          name: u.name,
          icon: u.icon || '⚔️'
        }))
      };
    });
  }
}

module.exports = UnitUnlockService;
