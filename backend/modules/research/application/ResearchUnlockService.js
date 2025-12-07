const { RESEARCH_DEFINITIONS, RESEARCH_CATEGORIES } = require('../domain/researchDefinitions');
const { runWithContext } = require('../../../utils/logger');

/**
 * ResearchUnlockService - Gestion des recherches disponibles
 * 
 * Système:
 * - Vérification des niveaux de bâtiments (Research Lab requis)
 * - Vérification des recherches prérequises
 * - Arbre de dépendances
 */
class ResearchUnlockService {
  constructor({ User, Research, Building, Facility, City, sequelize }) {
    this.User = User;
    this.Research = Research;
    this.Building = Building;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Obtenir toutes les recherches disponibles pour un joueur
   * @param {number} userId - ID du joueur
   * @returns {Promise<{available: Array, inProgress: Array, completed: Array, locked: Array}>}
   */
  async getAvailableResearch(userId) {
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
      const userResearch = await this.Research.findAll({
        where: { user_id: userId }
      });

      // Mapper les recherches complétées par nom vers leur ID de définition
      const completedResearchMap = {};
      userResearch.forEach(r => {
        if (r.level > 0) {
          completedResearchMap[r.name] = r.level;
        }
      });

      // Trouver les IDs de définition correspondants
      const completedIds = [];
      Object.values(RESEARCH_DEFINITIONS).forEach(def => {
        if (completedResearchMap[def.name]) {
          completedIds.push(def.id);
        }
      });
      
      // Pour l'instant, pas de système "in progress", on considère tout comme instantané
      const inProgressIds = [];

      // Récupérer niveaux des installations clés
      const researchLab = facilities.find(f => 
        f.name === 'Laboratoire de Recherche' || 
        f.name === 'Research Lab' ||
        f.name === 'Labo de Recherche'
      );
      const trainingCenter = facilities.find(f => 
        f.name === 'Centre d\'Entraînement' || 
        f.name === 'Terrain d\'Entrainement'
      );
      const forge = facilities.find(f => f.name === 'Forge Militaire');
      const commandCenter = facilities.find(f => f.name === 'Centre de Commandement');
      const defenseWorkshop = facilities.find(f => 
        f.name === 'Atelier de Défense' ||
        f.name === 'Defense Workshop'
      );
      const powerPlant = facilities.find(f => 
        f.name === 'Centrale Énergétique' ||
        f.name === 'Power Plant'
      );

      const buildingLevels = {
        researchLab: researchLab?.level || 0,
        trainingCenter: trainingCenter?.level || 0,
        forge: forge?.level || 0,
        commandCenter: commandCenter?.level || 0,
        defenseWorkshop: defenseWorkshop?.level || 0,
        powerPlant: powerPlant?.level || 0
      };

      const available = [];
      const completed = [];
      const inProgress = [];
      const locked = [];

      // Parcourir toutes les recherches
      for (const research of Object.values(RESEARCH_DEFINITIONS)) {
        const checkResult = this._checkResearchRequirements(research, {
          buildingLevels,
          completedIds
        });

        const researchData = {
          ...research,
          isCompleted: completedIds.includes(research.id),
          isInProgress: inProgressIds.includes(research.id),
          isAvailable: checkResult.isAvailable && !completedIds.includes(research.id) && !inProgressIds.includes(research.id),
          missingRequirements: checkResult.missingRequirements
        };

        if (completedIds.includes(research.id)) {
          completed.push(researchData);
        } else if (inProgressIds.includes(research.id)) {
          inProgress.push(researchData);
        } else if (checkResult.isAvailable) {
          available.push(researchData);
        } else {
          locked.push(researchData);
        }
      }

    return {
      available: available.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
      inProgress,
      completed: completed.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
      locked: locked.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
      buildings: buildingLevels,
      categories: RESEARCH_CATEGORIES
    };
  }

  /**
   * Vérifier si une recherche est disponible
   * @param {number} userId
   * @param {string} researchId
   * @returns {Promise<{isAvailable: boolean, reason: string}>}
   */
  async checkResearchAvailability(userId, researchId) {
    const research = RESEARCH_DEFINITIONS[researchId.toUpperCase()];
    if (!research) {
      throw new Error(`Research ${researchId} not found`);
    }

      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      const facilities = await this.Facility.findAll({ where: { city_id: city.id } });
      const completedResearch = await this.Research.findAll({
        where: { 
          user_id: userId
        }
      });

      // Mapper les recherches complétées par nom vers leur ID de définition
      const completedIds = [];
      completedResearch.forEach(r => {
        if (r.level > 0) {
          // Trouver l'ID de définition correspondant au nom
          const def = Object.values(RESEARCH_DEFINITIONS).find(d => d.name === r.name);
          if (def) {
            completedIds.push(def.id);
          }
        }
      });

      const researchLab = facilities.find(f => 
        f.name === 'Laboratoire de Recherche' || 
        f.name === 'Research Lab' ||
        f.name === 'Labo de Recherche'
      );
      const trainingCenter = facilities.find(f => 
        f.name === 'Centre d\'Entraînement' || 
        f.name === 'Terrain d\'Entrainement'
      );
      const forge = facilities.find(f => f.name === 'Forge Militaire');
      const commandCenter = facilities.find(f => f.name === 'Centre de Commandement');
      const defenseWorkshop = facilities.find(f => 
        f.name === 'Atelier de Défense' ||
        f.name === 'Defense Workshop'
      );
      const powerPlant = facilities.find(f => 
        f.name === 'Centrale Énergétique' ||
        f.name === 'Power Plant'
      );

      const buildingLevels = {
        researchLab: researchLab?.level || 0,
        trainingCenter: trainingCenter?.level || 0,
        forge: forge?.level || 0,
        commandCenter: commandCenter?.level || 0,
        defenseWorkshop: defenseWorkshop?.level || 0,
        powerPlant: powerPlant?.level || 0
      };

      const checkResult = this._checkResearchRequirements(research, {
        buildingLevels,
        completedIds
      });

    return {
      isAvailable: checkResult.isAvailable,
      reason: checkResult.isAvailable 
        ? 'Research available' 
        : checkResult.missingRequirements.join(', '),
      missingRequirements: checkResult.missingRequirements
    };
  }

  /**
   * Vérifier les prérequis d'une recherche
   * @private
   */
  _checkResearchRequirements(research, playerData) {
    const { buildingLevels, completedIds } = playerData;
    const missingRequirements = [];
    let isAvailable = true;

    // Vérifier les bâtiments requis
    if (research.requiredBuildings) {
      for (const [building, requiredLevel] of Object.entries(research.requiredBuildings)) {
        const playerLevel = buildingLevels[building] || 0;
        if (playerLevel < requiredLevel) {
          isAvailable = false;
          missingRequirements.push(
            `${this._getBuildingDisplayName(building)} Niv ${requiredLevel} (actuellement: ${playerLevel})`
          );
        }
      }
    }

    // Vérifier les recherches prérequises
    if (research.requiredResearch && research.requiredResearch.length > 0) {
      for (const reqId of research.requiredResearch) {
        if (!completedIds.includes(reqId)) {
          isAvailable = false;
          const reqResearch = RESEARCH_DEFINITIONS[reqId.toUpperCase()];
          missingRequirements.push(
            `Recherche: ${reqResearch?.name || reqId}`
          );
        }
      }
    }

    return {
      isAvailable,
      missingRequirements
    };
  }

  /**
   * Nom d'affichage des bâtiments
   * @private
   */
  _getBuildingDisplayName(buildingKey) {
    const names = {
      researchLab: 'Laboratoire de Recherche',
      trainingCenter: 'Centre d\'Entraînement',
      forge: 'Forge Militaire',
      commandCenter: 'Centre de Commandement',
      defenseWorkshop: 'Atelier de Défense',
      powerPlant: 'Centrale Énergétique'
    };
    return names[buildingKey] || buildingKey;
  }

  /**
   * Obtenir les recherches par catégorie
   * @param {number} userId
   * @param {string} category
   * @returns {Promise<Array>}
   */
  async getResearchByCategory(userId, category) {
    const allData = await this.getAvailableResearch(userId);
    const categoryFilter = (r) => r.category === category;

    return {
      available: allData.available.filter(categoryFilter),
      inProgress: allData.inProgress.filter(categoryFilter),
      completed: allData.completed.filter(categoryFilter),
      locked: allData.locked.filter(categoryFilter)
    };
  }

  /**
   * Démarrer ou continuer une recherche
   * @param {number} userId
   * @param {string} researchId - Research ID from RESEARCH_DEFINITIONS (e.g., 'MILITARY_TRAINING_1' or 'military_training_1')
   * @returns {Promise<Object>}
   */
  async startResearch(userId, researchId) {
    // Normaliser l'ID en cherchant dans les définitions
    const normalizedId = researchId.toUpperCase();
    const researchDef = RESEARCH_DEFINITIONS[normalizedId];
    
    if (!researchDef) {
      throw new Error(`Research definition not found: ${researchId}`);
    }

    // Utiliser l'ID de la définition (en minuscules)
    const techId = researchDef.id;

    // Vérifier la disponibilité
    const availabilityCheck = await this.checkResearchAvailability(userId, techId);
    if (!availabilityCheck.isAvailable) {
      throw new Error(`Research not available: ${availabilityCheck.reason}`);
    }

      // Vérifier si la recherche existe déjà dans la table researches
      let research = await this.Research.findOne({
        where: {
          user_id: userId,
          name: researchDef.name
        }
      });

      if (!research) {
        // Calculer le coût du niveau 1
        const costBreakdown = Object.entries(researchDef.cost || {});
        const totalCost = costBreakdown.reduce((sum, [, amount]) => sum + Number(amount || 0), 0);

        // Créer une nouvelle entrée de recherche
        research = await this.Research.create({
          user_id: userId,
          name: researchDef.name,
          level: 1,
          nextlevelcost: totalCost * 2, // Coût du niveau suivant
          description: researchDef.description || ''
        });
      } else {
        // Upgrader le niveau
        research.level = (research.level || 0) + 1;
        
        // Recalculer le coût du prochain niveau
        const costBreakdown = Object.entries(researchDef.cost || {});
        const baseCost = costBreakdown.reduce((sum, [, amount]) => sum + Number(amount || 0), 0);
        research.nextlevelcost = baseCost * (research.level + 1);
        
        await research.save();
      }

      // Mettre à jour les leaderboards
      const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
      leaderboardIntegration.updateResearchScore(userId).catch(() => {});
      leaderboardIntegration.updateTotalPower(userId).catch(() => {});

      // Grant Battle Pass XP
      const battlePassService = require('../../../modules/battlepass/application/BattlePassService');
      battlePassService.addXP(userId, 50).catch(() => {});

      // Check achievements
      const achievementChecker = require('../../../utils/achievementChecker');
      achievementChecker.checkResearchAchievements(userId).catch(() => {});

    return {
      message: 'Research started successfully',
      research: {
        id: research.id,
        name: research.name,
        level: research.level,
        nextlevelcost: research.nextlevelcost
      }
    };
  }
}

module.exports = ResearchUnlockService;
