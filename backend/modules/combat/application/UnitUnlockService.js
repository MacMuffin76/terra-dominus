const { UNIT_TIERS, UNIT_DEFINITIONS } = require('../domain/unitDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * UnitUnlockService - Gestion des débloca des unités par niveau et recherche
 * 
 * Ce service gère:
 * - Vérification des prérequis d'unlock (niveau joueur, recherches)
 * - Liste des unités disponibles pour un joueur
 * - Progression et notifications d'unlock
 */
class UnitUnlockService {
  constructor({ User, Research, sequelize }) {
    this.User = User;
    this.Research = Research;
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

      const userLevel = user.level || 1;
      const unlocked = [];
      const locked = [];
      let nextUnlock = null;

      // Parcourir toutes les unités
      for (const unit of Object.values(UNIT_DEFINITIONS)) {
        const tierInfo = Object.values(UNIT_TIERS).find(t => t.unlockLevel <= userLevel && 
          (Object.values(UNIT_TIERS).find(t2 => t2.unlockLevel === unit.tier)?.unlockLevel || 999) >= t.unlockLevel);
        
        const requiredLevel = Object.values(UNIT_TIERS).find(t => 
          t.unlockLevel === (Object.keys(UNIT_TIERS).find(k => UNIT_TIERS[k].unlockLevel === unit.tier) ? unit.tier : 999)
        )?.unlockLevel || 1;

        const isUnlocked = userLevel >= requiredLevel;

        const unitData = {
          ...unit,
          requiredLevel,
          tierName: Object.values(UNIT_TIERS).find(t => t.unlockLevel === requiredLevel)?.name || 'Basic',
          isUnlocked
        };

        if (isUnlocked) {
          unlocked.push(unitData);
        } else {
          locked.push(unitData);
          
          // Trouver le prochain unlock
          if (!nextUnlock || requiredLevel < nextUnlock.requiredLevel) {
            nextUnlock = {
              ...unitData,
              levelsRemaining: requiredLevel - userLevel
            };
          }
        }
      }

      return {
        unlocked: unlocked.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
        locked: locked.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
        nextUnlock,
        currentLevel: userLevel,
        tierProgress: this._calculateTierProgress(userLevel)
      };
    });
  }

  /**
   * Vérifier si une unité est débloquée pour un joueur
   * @param {number} userId - ID du joueur
   * @param {string} unitId - ID de l'unité (ex: 'cavalry', 'tanks')
   * @returns {Promise<{isUnlocked: boolean, reason: string, requiredLevel: number}>}
   */
  async checkUnitUnlock(userId, unitId) {
    return runWithContext(async () => {
      const user = await this.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const unit = UNIT_DEFINITIONS[unitId];
      if (!unit) {
        throw new Error(`Unit ${unitId} not found`);
      }

      const userLevel = user.level || 1;
      const tierInfo = Object.values(UNIT_TIERS)[unit.tier - 1];
      const requiredLevel = tierInfo?.unlockLevel || 1;

      const isUnlocked = userLevel >= requiredLevel;

      return {
        isUnlocked,
        reason: isUnlocked 
          ? 'Unit unlocked' 
          : `Requires player level ${requiredLevel} (current: ${userLevel})`,
        requiredLevel,
        currentLevel: userLevel,
        unit: {
          id: unit.id,
          name: unit.name,
          tier: unit.tier
        }
      };
    });
  }

  /**
   * Obtenir les unités qui viennent d'être débloquées après un level up
   * @param {number} userId - ID du joueur
   * @param {number} oldLevel - Ancien niveau
   * @param {number} newLevel - Nouveau niveau
   * @returns {Promise<Array>} - Liste des unités nouvellement débloquées
   */
  async getNewlyUnlockedUnits(userId, oldLevel, newLevel) {
    return runWithContext(async () => {
      const newlyUnlocked = [];

      // Vérifier chaque tier
      for (const [tierKey, tierInfo] of Object.entries(UNIT_TIERS)) {
        if (oldLevel < tierInfo.unlockLevel && newLevel >= tierInfo.unlockLevel) {
          // Ce tier vient d'être débloqué !
          const tierNumber = parseInt(tierKey.split('_')[1]);
          const tierUnits = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tierNumber);
          
          newlyUnlocked.push({
            tier: tierNumber,
            tierName: tierInfo.name,
            unlockLevel: tierInfo.unlockLevel,
            units: tierUnits
          });
        }
      }

      return newlyUnlocked;
    });
  }

  /**
   * Calculer la progression dans les tiers
   * @param {number} userLevel - Niveau du joueur
   * @returns {Object} - Info de progression
   */
  _calculateTierProgress(userLevel) {
    const tiers = Object.values(UNIT_TIERS).sort((a, b) => a.unlockLevel - b.unlockLevel);
    
    let currentTier = null;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      if (userLevel >= tiers[i].unlockLevel) {
        currentTier = { ...tiers[i], number: i + 1 };
      } else if (!nextTier) {
        nextTier = { ...tiers[i], number: i + 1 };
        break;
      }
    }

    // Si on n'a pas de nextTier, on est au max
    if (!nextTier && currentTier) {
      return {
        currentTier,
        nextTier: null,
        progress: 100,
        levelsToNext: 0,
        message: 'All tiers unlocked!'
      };
    }

    const progress = nextTier ? 
      ((userLevel - (currentTier?.unlockLevel || 0)) / (nextTier.unlockLevel - (currentTier?.unlockLevel || 0))) * 100 
      : 0;

    return {
      currentTier: currentTier || { name: 'None', number: 0, unlockLevel: 0 },
      nextTier,
      progress: Math.round(progress),
      levelsToNext: nextTier ? nextTier.unlockLevel - userLevel : 0,
      message: nextTier ? 
        `${nextTier.levelsToNext} levels until ${nextTier.name}` : 
        'All tiers unlocked!'
    };
  }

  /**
   * Obtenir un résumé des tiers pour l'UI
   * @param {number} userLevel - Niveau du joueur
   * @returns {Array} - Liste des tiers avec statut
   */
  getTiersSummary(userLevel) {
    return Object.entries(UNIT_TIERS).map(([key, tierInfo], index) => {
      const tierNumber = index + 1;
      const isUnlocked = userLevel >= tierInfo.unlockLevel;
      const unitsInTier = Object.values(UNIT_DEFINITIONS).filter(u => u.tier === tierNumber);

      return {
        tier: tierNumber,
        name: tierInfo.name,
        unlockLevel: tierInfo.unlockLevel,
        isUnlocked,
        unitCount: unitsInTier.length,
        units: unitsInTier.map(u => ({
          id: u.id,
          name: u.name,
          icon: this._getUnitIcon(u.category)
        })),
        levelsRemaining: isUnlocked ? 0 : tierInfo.unlockLevel - userLevel
      };
    });
  }

  /**
   * Helper pour obtenir l'icône d'une unité selon sa catégorie
   */
  _getUnitIcon(category) {
    const icons = {
      infantry: '🪖',
      cavalry: '🐴',
      ranged: '🏹',
      artillery: '💣',
      engineer: '🔧',
      armor: '🛡️',
      air: '✈️',
      special: '🎖️'
    };
    return icons[category] || '⚔️';
  }
}

module.exports = UnitUnlockService;
