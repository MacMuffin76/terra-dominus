const { FACILITY_DEFINITIONS } = require('../domain/facilityDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * FacilityUnlockService - Gestion du déverrouillage des installations
 * 
 * Système de déblocage basé sur le niveau du Centre de Commandement:
 * - Chaque installation nécessite un niveau minimum du Centre de Commandement
 * - Le Centre de Commandement lui-même n'a pas de prérequis
 * - Les améliorations d'installations peuvent aussi être limitées par le niveau du CC
 */
class FacilityUnlockService {
  constructor({ User, Facility, City, sequelize }) {
    this.User = User;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Obtenir le niveau actuel du Centre de Commandement
   * @param {number} userId - ID du joueur
   * @returns {Promise<number>}
   */
  async getCommandCenterLevel(userId) {
    return runWithContext(async () => {
      const city = await this.City.findOne({ 
        where: { user_id: userId, is_capital: true } 
      });
      
      if (!city) {
        throw new Error('City not found');
      }

      const commandCenter = await this.Facility.findOne({
        where: { 
          city_id: city.id,
          name: 'Centre de Commandement'
        }
      });

      return commandCenter?.level || 0;
    });
  }

  /**
   * Vérifier si une installation peut être construite/améliorée
   * @param {number} userId - ID du joueur
   * @param {string} facilityKey - Clé de l'installation (ex: 'TRAINING_CENTER')
   * @param {number} targetLevel - Niveau cible (optionnel, par défaut = niveau actuel + 1)
   * @returns {Promise<{canBuild: boolean, reason: string, commandCenterLevel: number, requiredLevel: number}>}
   */
  async checkFacilityUnlock(userId, facilityKey, targetLevel = null) {
    return runWithContext(async () => {
      const facilityDef = FACILITY_DEFINITIONS[facilityKey.toUpperCase()];
      if (!facilityDef) {
        return {
          canBuild: false,
          reason: `Installation ${facilityKey} non trouvée`,
          commandCenterLevel: 0,
          requiredLevel: 0
        };
      }

      // Le Centre de Commandement n'a pas de prérequis
      if (facilityKey.toUpperCase() === 'COMMAND_CENTER') {
        return {
          canBuild: true,
          reason: 'Centre de Commandement disponible',
          commandCenterLevel: 0,
          requiredLevel: 0
        };
      }

      const city = await this.City.findOne({ 
        where: { user_id: userId, is_capital: true } 
      });
      
      if (!city) {
        throw new Error('City not found');
      }

      // Récupérer le niveau du Centre de Commandement
      const commandCenterLevel = await this.getCommandCenterLevel(userId);

      // Récupérer le niveau actuel de l'installation
      const playerFacility = await this.Facility.findOne({
        where: { 
          city_id: city.id,
          name: facilityDef.name
        }
      });

      const currentLevel = playerFacility?.level || 0;
      const desiredLevel = targetLevel || (currentLevel + 1);

      // Déterminer le niveau requis du Centre de Commandement
      const requiredLevel = this._getRequiredCommandCenterLevel(facilityKey, desiredLevel);

      const canBuild = commandCenterLevel >= requiredLevel;

      return {
        canBuild,
        reason: canBuild 
          ? 'Installation disponible' 
          : `Centre de Commandement niveau ${requiredLevel} requis (actuellement: ${commandCenterLevel})`,
        commandCenterLevel,
        requiredLevel,
        currentFacilityLevel: currentLevel,
        targetLevel: desiredLevel
      };
    });
  }

  /**
   * Obtenir toutes les installations avec leur statut de déverrouillage
   * @param {number} userId - ID du joueur
   * @returns {Promise<Array>}
   */
  async getAvailableFacilities(userId) {
    return runWithContext(async () => {
      const city = await this.City.findOne({ 
        where: { user_id: userId, is_capital: true } 
      });
      
      if (!city) {
        throw new Error('City not found');
      }

      const commandCenterLevel = await this.getCommandCenterLevel(userId);
      const playerFacilities = await this.Facility.findAll({ 
        where: { city_id: city.id } 
      });

      const facilities = [];

      for (const [key, facilityDef] of Object.entries(FACILITY_DEFINITIONS)) {
        const playerFacility = playerFacilities.find(f => 
          f.name === facilityDef.name || 
          f.type === key.toLowerCase()
        );

        const currentLevel = playerFacility?.level || 0;
        const nextLevel = currentLevel + 1;

        // Vérifier si l'installation peut être construite/améliorée
        const buildCheck = await this.checkFacilityUnlock(userId, key, nextLevel);
        
        // Vérifier si le niveau max peut être atteint avec l'upgrade
        const maxLevelCheck = await this.checkFacilityUnlock(userId, key, facilityDef.maxLevel);

        facilities.push({
          key,
          name: facilityDef.name,
          description: facilityDef.description,
          icon: facilityDef.icon,
          category: facilityDef.category,
          currentLevel,
          maxLevel: facilityDef.maxLevel,
          isBuilt: currentLevel > 0,
          canUpgrade: buildCheck.canBuild && currentLevel < facilityDef.maxLevel,
          isLocked: !buildCheck.canBuild,
          lockReason: buildCheck.reason,
          requiredCommandCenterLevel: buildCheck.requiredLevel,
          currentCommandCenterLevel: commandCenterLevel,
          maxLevelReachable: maxLevelCheck.requiredLevel
        });
      }

      return {
        facilities: facilities.sort((a, b) => {
          // Tri par catégorie puis par nom
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        }),
        commandCenterLevel
      };
    });
  }

  /**
   * Déterminer le niveau requis du Centre de Commandement pour une installation
   * @private
   * @param {string} facilityKey - Clé de l'installation
   * @param {number} targetLevel - Niveau cible de l'installation
   * @returns {number} - Niveau requis du Centre de Commandement
   */
  _getRequiredCommandCenterLevel(facilityKey, targetLevel) {
    const key = facilityKey.toUpperCase();

    // Le Centre de Commandement n'a pas de prérequis
    if (key === 'COMMAND_CENTER') {
      return 0;
    }

    // Règles de déverrouillage basées sur le niveau du Centre de Commandement
    // Format: [niveau CC requis, niveau max installation autorisé]
    const unlockRules = {
      'TRAINING_CENTER': [
        [1, 3],   // CC niv 1 => Centre d'Entraînement jusqu'au niv 3
        [2, 5],   // CC niv 2 => Centre d'Entraînement jusqu'au niv 5
        [4, 8],   // CC niv 4 => Centre d'Entraînement jusqu'au niv 8
        [6, 10],  // CC niv 6 => Centre d'Entraînement jusqu'au niv 10
        [8, 15]   // CC niv 8 => Centre d'Entraînement jusqu'au niv 15 (max)
      ],
      'DEFENSE_WORKSHOP': [
        [1, 3],   // CC niv 1 => Atelier de Défense jusqu'au niv 3
        [2, 5],   // CC niv 2 => Atelier de Défense jusqu'au niv 5
        [4, 8],   // CC niv 4 => Atelier de Défense jusqu'au niv 8
        [7, 10],  // CC niv 7 => Atelier de Défense jusqu'au niv 10
        [9, 15]   // CC niv 9 => Atelier de Défense jusqu'au niv 15 (max)
      ],
      'RESEARCH_LAB': [
        [3, 5],   // CC niv 3 => Laboratoire de Recherche jusqu'au niv 5
        [5, 10],  // CC niv 5 => Laboratoire de Recherche jusqu'au niv 10
        [8, 15]   // CC niv 8 => Laboratoire de Recherche jusqu'au niv 15 (max)
      ],
      'FORGE': [
        [5, 5],   // CC niv 5 => Forge Militaire jusqu'au niv 5
        [7, 8],   // CC niv 7 => Forge Militaire jusqu'au niv 8
        [9, 10]   // CC niv 9 => Forge Militaire jusqu'au niv 10 (max)
      ],
      'MILITARY_FORGE': [
        [5, 5],   // Alias pour Forge Militaire
        [7, 8],
        [9, 10]
      ],
      'TRADING_POST': [
        [6, 5],   // CC niv 6 => Comptoir Commercial jusqu'au niv 5
        [8, 10]   // CC niv 8 => Comptoir Commercial jusqu'au niv 10 (max)
      ]
    };

    const rules = unlockRules[key];
    if (!rules) {
      // Par défaut: disponible dès le début
      return 1;
    }

    // Trouver le niveau CC requis pour le niveau cible
    for (const [ccLevel, maxFacilityLevel] of rules) {
      if (targetLevel <= maxFacilityLevel) {
        return ccLevel;
      }
    }

    // Si on dépasse toutes les règles, retourner le dernier niveau CC requis
    return rules[rules.length - 1][0];
  }

  /**
   * Obtenir un résumé de la progression par rapport au Centre de Commandement
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUnlockProgressSummary(userId) {
    return runWithContext(async () => {
      const commandCenterLevel = await this.getCommandCenterLevel(userId);
      const availableData = await this.getAvailableFacilities(userId);

      const locked = availableData.facilities.filter(f => f.isLocked && f.currentLevel === 0);
      const upgradeLocked = availableData.facilities.filter(f => 
        f.currentLevel > 0 && !f.canUpgrade && f.currentLevel < f.maxLevel
      );
      const unlocked = availableData.facilities.filter(f => f.canUpgrade || f.currentLevel === f.maxLevel);

      return {
        commandCenterLevel,
        totalFacilities: availableData.facilities.length,
        locked: locked.length,
        upgradeLocked: upgradeLocked.length,
        unlocked: unlocked.length,
        nextUnlock: locked.length > 0 
          ? locked.sort((a, b) => a.requiredCommandCenterLevel - b.requiredCommandCenterLevel)[0]
          : null,
        nextUpgradeUnlock: upgradeLocked.length > 0
          ? upgradeLocked.sort((a, b) => a.requiredCommandCenterLevel - b.requiredCommandCenterLevel)[0]
          : null
      };
    });
  }
}

module.exports = FacilityUnlockService;
