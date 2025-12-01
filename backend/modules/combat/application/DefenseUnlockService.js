const { DEFENSE_DEFINITIONS, DEFENSE_TIERS } = require('../domain/defenseDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * DefenseUnlockService - Gestion des débloca des défenses par bâtiments et recherches
 * 
 * Nouveau système:
 * - Vérification des niveaux de bâtiments (Defense Workshop)
 * - Vérification des recherches complétées
 * - Liste des défenses disponibles pour un joueur
 */
class DefenseUnlockService {
  constructor({ User, Research, Building, Facility, City, sequelize }) {
    this.User = User;
    this.Research = Research;
    this.Building = Building;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Obtenir toutes les défenses débloquées pour un joueur
   * @param {number} userId - ID du joueur
   * @returns {Promise<{unlocked: Array, locked: Array, nextUnlock: Object}>}
   */
  async getAvailableDefenses(userId) {
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

      // Récupérer les recherches complétées
      const completedResearch = await this.Research.findAll({
        where: { 
          user_id: userId,
          level: { [this.sequelize.Sequelize.Op.gt]: 0 }
        }
      });

      const researchIds = completedResearch.map(r => r.name);

      // Récupérer niveau de l'Atelier de Défense
      const defenseWorkshop = facilities.find(f => 
        f.name === 'Atelier de Défense' || 
        f.name === 'Defense Workshop' ||
        f.name === 'Atelier Défensif'
      );
      
      const defenseWorkshopLevel = defenseWorkshop?.level || 0;

      const unlocked = [];
      const locked = [];
      let nextUnlock = null;

      // Parcourir toutes les défenses
      for (const defense of Object.values(DEFENSE_DEFINITIONS)) {
        const checkResult = this._checkDefenseRequirements(defense, {
          defenseWorkshopLevel,
          researchIds
        });

        const defenseData = {
          ...defense,
          isUnlocked: checkResult.isUnlocked,
          missingRequirements: checkResult.missingRequirements,
          tierName: `Tier ${defense.tier}`
        };

        if (checkResult.isUnlocked) {
          unlocked.push(defenseData);
        } else {
          locked.push(defenseData);
          
          // Trouver le prochain unlock (par tier)
          if (!nextUnlock || defense.tier < nextUnlock.tier) {
            nextUnlock = {
              ...defenseData,
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
          defenseWorkshopLevel
        },
        tierProgress: this._calculateTierProgress(defenseWorkshopLevel)
      };
    });
  }

  /**
   * Vérifier si une défense est débloquée pour un joueur
   * @param {number} userId - ID du joueur
   * @param {string} defenseId - ID de la défense (ex: 'machine_gun_turret', 'plasma_turret')
   * @returns {Promise<{isUnlocked: boolean, reason: string, missingRequirements: Array}>}
   */
  async checkDefenseUnlock(userId, defenseId) {
    return runWithContext(async () => {
      const defense = DEFENSE_DEFINITIONS[defenseId.toUpperCase()];
      if (!defense) {
        throw new Error(`Defense ${defenseId} not found`);
      }

      // Récupérer la ville du joueur
      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      // Récupérer les bâtiments/facilities du joueur
      const facilities = await this.Facility.findAll({ where: { city_id: city.id } });

      // Récupérer les recherches complétées
      const completedResearch = await this.Research.findAll({
        where: { 
          user_id: userId,
          level: { [this.sequelize.Sequelize.Op.gt]: 0 }
        }
      });

      const researchIds = completedResearch.map(r => r.name);

      // Récupérer niveau de l'Atelier de Défense
      const defenseWorkshop = facilities.find(f => 
        f.name === 'Atelier de Défense' || 
        f.name === 'Defense Workshop' ||
        f.name === 'Atelier Défensif'
      );
      
      const defenseWorkshopLevel = defenseWorkshop?.level || 0;

      const checkResult = this._checkDefenseRequirements(defense, {
        defenseWorkshopLevel,
        researchIds
      });

      return {
        isUnlocked: checkResult.isUnlocked,
        reason: checkResult.isUnlocked 
          ? 'Defense unlocked' 
          : checkResult.missingRequirements.join(', '),
        missingRequirements: checkResult.missingRequirements,
        defense: {
          id: defense.id,
          name: defense.name,
          tier: defense.tier
        }
      };
    });
  }

  /**
   * Vérifier les prérequis d'une défense
   * @private
   */
  _checkDefenseRequirements(defense, playerData) {
    const { defenseWorkshopLevel, researchIds } = playerData;
    const missingRequirements = [];
    let isUnlocked = true;

    // Vérifier Defense Workshop
    if (defense.requiredBuildings.defenseWorkshop) {
      if (defenseWorkshopLevel < defense.requiredBuildings.defenseWorkshop) {
        isUnlocked = false;
        missingRequirements.push(
          `Atelier de Défense Niv ${defense.requiredBuildings.defenseWorkshop} (actuellement: ${defenseWorkshopLevel})`
        );
      }
    }

    // Vérifier recherches
    if (defense.requiredResearch && defense.requiredResearch.length > 0) {
      for (const researchId of defense.requiredResearch) {
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
   * @param {number} defenseWorkshopLevel - Niveau Atelier de Défense
   * @returns {Object} - Info de progression
   */
  _calculateTierProgress(defenseWorkshopLevel) {
    const tiers = [
      { tier: 1, requiredLevel: 1, name: 'Défenses de Base' },
      { tier: 2, requiredLevel: 3, name: 'Défenses Avancées' },
      { tier: 3, requiredLevel: 5, name: 'Défenses Lourdes' },
      { tier: 4, requiredLevel: 8, name: 'Défenses d\'Élite' }
    ];
    
    let currentTier = null;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      
      if (defenseWorkshopLevel >= tier.requiredLevel) {
        currentTier = tier;
      } else if (!nextTier) {
        nextTier = tier;
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
      missingForNext.push(`Atelier Niv ${nextTier.requiredLevel}`);
    }

    return {
      currentTier: currentTier || { name: 'Aucun', tier: 0 },
      nextTier,
      missingForNext,
      message: nextTier ? 
        `Prochain tier: ${nextTier.name} - ${missingForNext.join(', ')}` : 
        'Tous les tiers débloqués!'
    };
  }

  /**
   * Obtenir un résumé des tiers pour l'UI
   * @param {number} defenseWorkshopLevel
   * @returns {Array} - Liste des tiers avec statut
   */
  getTiersSummary(defenseWorkshopLevel) {
    const tiers = [
      { tier: 1, requiredLevel: 1, name: 'Défenses de Base' },
      { tier: 2, requiredLevel: 3, name: 'Défenses Avancées' },
      { tier: 3, requiredLevel: 5, name: 'Défenses Lourdes' },
      { tier: 4, requiredLevel: 8, name: 'Défenses d\'Élite' }
    ];

    return tiers.map(tierInfo => {
      const isUnlocked = defenseWorkshopLevel >= tierInfo.requiredLevel;
      const defensesInTier = Object.values(DEFENSE_DEFINITIONS).filter(d => d.tier === tierInfo.tier);

      return {
        tier: tierInfo.tier,
        name: tierInfo.name,
        requiredLevel: tierInfo.requiredLevel,
        isUnlocked,
        defenseCount: defensesInTier.length,
        defenses: defensesInTier.map(d => ({
          id: d.id,
          name: d.name,
          icon: d.icon || '🛡️'
        }))
      };
    });
  }
}

module.exports = DefenseUnlockService;
