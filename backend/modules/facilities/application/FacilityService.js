const { FACILITY_DEFINITIONS } = require('../domain/facilityDefinitions');
const { runWithContext } = require('../../../utils/logger');
const ConstructionQueue = require('../../../models/ConstructionQueue');
const Entity = require('../../../models/Entity');
const Resource = require('../../../models/Resource');
const { scheduleConstructionCompletion } = require('../../../jobs/constructionQueue');

/**
 * FacilityService - Gestion des installations stratégiques
 * 
 * Système:
 * - Liste des installations disponibles
 * - Calcul des bonus par niveau
 * - Coûts d'amélioration
 * - Queue de construction avec timers
 */
class FacilityService {
  constructor({ User, Facility, City, sequelize }) {
    this.User = User;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;
  }

  /**
   * Mapper les noms de ressources anglais vers français
   * @param {string} resourceName - Nom anglais de la ressource
   * @returns {string} - Nom français de la ressource
   */
  _mapResourceName(resourceName) {
    const mapping = {
      'gold': 'or',
      'metal': 'metal',
      'fuel': 'carburant',
      'energy': 'energie'
    };
    return mapping[resourceName.toLowerCase()] || resourceName;
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

      // Récupérer les constructions en cours depuis la queue
      const queueItems = await ConstructionQueue.findAll({
        where: {
          cityId: city.id,
          type: 'facility',
          status: 'in_progress'
        }
      });

      // Mapper les queue items par entityId pour accès rapide
      const queueByEntityId = new Map();
      for (const item of queueItems) {
        queueByEntityId.set(item.entityId, item);
      }

      // Trouver le niveau actuel du Centre de Commandement
      const commandCenter = playerFacilities.find(f => 
        f.name === 'Centre de Commandement' || f.type === 'command_center'
      );
      const currentCCLevel = commandCenter?.level || 0;

      const facilities = [];

      // Parcourir toutes les définitions d'installations
      for (const [key, facilityDef] of Object.entries(FACILITY_DEFINITIONS)) {
        // Trouver l'installation correspondante du joueur
        const playerFacility = playerFacilities.find(f => 
          f.name === facilityDef.name || 
          f.type === key.toLowerCase()
        );

        const currentLevel = playerFacility?.level || 0;
        // Une facility est "construite" si elle existe en DB, même au niveau 0
        const isBuilt = !!playerFacility;

        // Vérifier s'il y a une construction en cours
        let entity = await Entity.findOne({
          where: {
            entity_type: 'facility',
            entity_name: facilityDef.name
          }
        });

        let status = 'idle';
        let constructionEndsAt = null;
        let remainingTime = 0;

        if (entity) {
          const queueItem = queueByEntityId.get(entity.entity_id);
          if (queueItem) {
            status = 'building';
            constructionEndsAt = queueItem.finishTime;
            const now = new Date();
            remainingTime = Math.max(0, Math.ceil((new Date(constructionEndsAt) - now) / 1000));
          }
        }

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

        // Vérifier si les prérequis de CC sont remplis
        const requiredCC = facilityDef.requiredCommandCenter || 0;
        const meetsRequirement = currentCCLevel >= requiredCC;

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
          status,
          constructionEndsAt,
          remainingTime,
          currentBonuses,
          nextBonuses,
          upgradeCost,
          levelUnlocks,
          nextLevelUnlocks,
          baseStats: facilityDef.baseStats,
          requiredCommandCenter: requiredCC,
          currentCommandCenterLevel: currentCCLevel,
          meetsRequirement
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

  /**
   * Améliorer une installation par sa clé
   * @param {number} userId
   * @param {string} facilityKey - Clé de l'installation (ex: 'TRAINING_CENTER')
   * @param {Object} facilityUnlockService - Service de déverrouillage (optionnel)
   * @returns {Promise<Object>}
   */
  async upgradeFacilityByKey(userId, facilityKey, facilityUnlockService = null) {
    const facilityDef = FACILITY_DEFINITIONS[facilityKey.toUpperCase()];
    if (!facilityDef) {
      throw new Error(`Facility definition not found: ${facilityKey}`);
    }

    return await this.sequelize.transaction(async (transaction) => {
      const city = await this.City.findOne({ 
        where: { user_id: userId, is_capital: true },
        transaction
      });
      if (!city) {
        throw new Error('City not found');
      }

      // Trouver ou créer l'installation
      let facility = await this.Facility.findOne({ 
        where: { 
          city_id: city.id,
          name: facilityDef.name
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const currentLevel = facility ? facility.level : 0;
      const targetLevel = currentLevel + 1;

      // Vérifier que le niveau max n'est pas atteint
      if (currentLevel >= facilityDef.maxLevel) {
        const error = new Error('Max level reached for this facility');
        error.status = 400;
        throw error;
      }

      // Vérifier les prérequis de déverrouillage si le service est fourni
      if (facilityUnlockService) {
        const unlockCheck = await facilityUnlockService.checkFacilityUnlock(
          userId, 
          facilityKey, 
          targetLevel
        );

        if (!unlockCheck.canBuild) {
          const error = new Error(unlockCheck.reason);
          error.status = 403;
          throw error;
        }
      }

      // Calculer le coût et vérifier les ressources
      const upgradeCost = this._calculateUpgradeCost(facilityDef, targetLevel);
      console.log(`[FacilityService] Upgrade cost for ${facilityDef.name} level ${targetLevel}:`, upgradeCost);
      
      const resources = await Resource.findAll({
        where: { city_id: city.id },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      console.log(`[FacilityService] Resources before deduction:`, resources.map(r => ({ type: r.type, amount: r.amount })));

      // Vérifier que le joueur a assez de ressources
      for (const [resourceType, cost] of Object.entries(upgradeCost)) {
        const mappedType = this._mapResourceName(resourceType);
        const resource = resources.find(r => r.type.toLowerCase() === mappedType.toLowerCase());
        if (!resource || resource.amount < cost) {
          const availableAmount = resource?.amount ?? 0;
          const error = new Error(`Not enough ${resourceType}. Required: ${cost}, Available: ${availableAmount}`);
          error.status = 400;
          throw error;
        }
      }

      // Déduire les ressources
      for (const [resourceType, cost] of Object.entries(upgradeCost)) {
        const mappedType = this._mapResourceName(resourceType);
        const resource = resources.find(r => r.type.toLowerCase() === mappedType.toLowerCase());
        console.log(`[FacilityService] Deducting ${cost} ${mappedType} (was: ${resource.amount})`);
        resource.amount -= cost;
        await resource.save({ transaction });
        console.log(`[FacilityService] After deduction: ${resource.amount}`);
      }

      // Créer ou récupérer l'entité pour la queue
      let entity = await Entity.findOne({
        where: {
          entity_type: 'facility',
          entity_name: facilityDef.name,
        },
        transaction
      });

      if (!entity) {
        entity = await Entity.create({
          entity_type: 'facility',
          entity_name: facilityDef.name,
        }, { transaction });
      }

      // Vérifier s'il y a déjà une construction en cours pour cette facility
      const existingQueue = await ConstructionQueue.findOne({
        where: {
          cityId: city.id,
          entityId: entity.entity_id,
          type: 'facility',
          status: 'in_progress'
        },
        transaction
      });

      if (existingQueue) {
        const error = new Error('A construction is already in progress for this facility');
        error.status = 409;
        throw error;
      }

      // Créer la facility si elle n'existe pas encore
      if (!facility) {
        facility = await this.Facility.create({
          city_id: city.id,
          name: facilityDef.name,
          type: facilityKey.toLowerCase(),
          level: 0
        }, { transaction });
      }

      // Calculer la durée de construction (utiliser baseBuildTime de la définition)
      const baseDuration = facilityDef.baseBuildTime || 300; // 5 minutes par défaut
      const buildDuration = Math.floor(baseDuration * Math.pow(1.5, currentLevel));

      const nowMs = Date.now();
      const finishTimeMs = nowMs + buildDuration * 1000;

      // Créer l'entrée dans la construction queue
      const queueItem = await ConstructionQueue.create({
        cityId: city.id,
        entityId: entity.entity_id,
        type: 'facility',
        status: 'in_progress',
        startTime: new Date(nowMs),
        finishTime: new Date(finishTimeMs),
        slot: 1,
      }, { transaction });

      const queueId = queueItem.id;
      const finishTime = queueItem.finishTime;

      transaction.afterCommit(async () => {
        try {
          // Relire l'item de la queue après le commit pour s'assurer de la cohérence
          const committedItem = await ConstructionQueue.findByPk(queueId);
          if (!committedItem) {
            console.error(`[FacilityService] Queue item ${queueId} not found after commit`);
            return;
          }

          console.log(`[FacilityService] Scheduling facility construction completion for queueItem ${queueId}`);
          await scheduleConstructionCompletion({
            id: committedItem.id,
            finishTime: committedItem.finishTime,
          }, { userId });
          console.log(`[FacilityService] Successfully scheduled facility construction completion for queueItem ${queueId}`);
        } catch (err) {
          console.error(`[FacilityService] Error in afterCommit for queueItem ${queueId}:`, err);
        }
      });

      return {
        message: 'Construction started',
        queueId: queueItem.id,
        facilityId: facility.id,
        facilityKey,
        facilityName: facility.name,
        status: 'in_progress',
        finishTime: finishTime,
        buildDuration,
        currentLevel,
        targetLevel
      };
    });
  }

  /**
   * Finaliser l'amélioration d'une facility depuis la queue
   * @param {number} queueId - ID de l'entrée dans la queue
   * @param {number} userId - ID du joueur (optionnel, pour logging)
   * @returns {Promise<Object>}
   */
  async finalizeFacilityUpgrade(queueId, userId = null) {
    return await this.sequelize.transaction(async (transaction) => {
      const queueItem = await ConstructionQueue.findOne({
        where: { id: queueId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!queueItem) {
        throw new Error(`Queue item ${queueId} not found`);
      }

      if (queueItem.status !== 'in_progress') {
        console.log(`[FacilityService] Queue item ${queueId} already in status ${queueItem.status}`);
        return { message: 'Already processed', status: queueItem.status };
      }

      // Vérifier que le timer est écoulé
      const now = new Date();
      if (queueItem.finishTime > now) {
        const error = new Error('Construction not finished yet');
        error.status = 400;
        throw error;
      }

      // Récupérer l'entité pour trouver la facility
      const entity = await Entity.findOne({
        where: { entity_id: queueItem.entityId },
        transaction
      });

      if (!entity) {
        throw new Error(`Entity ${queueItem.entityId} not found`);
      }

      // Récupérer la facility
      const facility = await this.Facility.findOne({
        where: {
          city_id: queueItem.cityId,
          name: entity.entity_name
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!facility) {
        throw new Error(`Facility ${entity.entity_name} not found in city ${queueItem.cityId}`);
      }

      // Upgrader le niveau
      facility.level += 1;
      facility.date_modification = new Date();
      await facility.save({ transaction });

      // Marquer la queue comme completed
      queueItem.status = 'completed';
      await queueItem.save({ transaction });

      console.log(`[FacilityService] Facility ${facility.name} upgraded to level ${facility.level}`);

      // Après commit, émettre l'événement socket pour rafraîchir la production
      transaction.afterCommit(async () => {
        try {
          const { getIO } = require('../../../socket');
          const io = getIO();
          if (io && userId) {
            const queue = await ConstructionQueue.findAll({
              where: { cityId: queueItem.cityId },
              order: [['slot', 'ASC']],
            });
            io.to(`user_${userId}`).emit('construction_queue:update', queue);
          }
        } catch (err) {
          console.error('[FacilityService] Error in afterCommit:', err);
        }
      });

      return {
        message: 'Facility upgrade completed',
        facility: {
          id: facility.id,
          name: facility.name,
          level: facility.level
        }
      };
    });
  }
}

module.exports = FacilityService;
