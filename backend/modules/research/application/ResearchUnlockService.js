const { Op } = require('sequelize');
const {
  RESEARCH_DEFINITIONS,
  RESEARCH_CATEGORIES,
} = require('../domain/researchDefinitions');
const { getResearchDurationSeconds } = require('../../../utils/balancing');
const { getIO } = require('../../../socket');
const CityService = require('../../cities/application/CityService');
const { ResearchQueueRepository } = require('../../../repositories/ResearchQueueRepository');
const Resource = require('../../../models/Resource');
const ResearchQueue = require('../../../models/ResearchQueue');

function assertOptimisticUpdate(updatedRows) {
  if (!updatedRows) {
    const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
    error.status = 409;
    throw error;
  }
}

function sumCost(costs) {
  return costs.reduce((sum, [, amount]) => sum + Number(amount || 0), 0);
}

function getDefinitionFromName(name) {
  return Object.values(RESEARCH_DEFINITIONS).find((def) => def.name === name);
}

class ResearchUnlockService {
  constructor({ User, Research, Building, Facility, City, sequelize }) {
    this.User = User;
    this.Research = Research;
    this.Building = Building;
    this.Facility = Facility;
    this.City = City;
    this.sequelize = sequelize;

    this.researchQueueRepository = new ResearchQueueRepository();
    this.cityService = new CityService();
  }

  async _getMainCity(userId, options = {}) {
    return this.City.findOne({
      where: { user_id: userId, is_capital: true },
      ...options,
    });
  }

  _computeCostBreakdown(researchDef, level) {
    return Object.entries(researchDef.cost || {}).map(([resource, amount]) => [
      resource,
      Number(amount || 0) * level,
    ]);
  }

  _computeDurationSeconds(researchDef, level, city) {
    const bonuses = this.cityService.getSpecializationBonuses(city.specialization);
    const speedMultiplier = bonuses.researchSpeed || 1;
    return getResearchDurationSeconds(researchDef.researchTime, level, speedMultiplier);
  }

  _formatQueueItems(queue, researchMap) {
    return queue.map((item) => {
      const research = researchMap.get(item.researchId);
      const def = research ? getDefinitionFromName(research.name) : null;
      const remainingSeconds = item.finishTime
        ? Math.max(0, Math.ceil((new Date(item.finishTime) - new Date()) / 1000))
        : 0;

      return {
        ...item.toJSON(),
        researchKey: def?.id || null,
        researchName: research?.name || def?.name || null,
        remainingSeconds,
      };
    });
  }

  async _ensureResources(cityId, costs, transaction) {
    // Mapping logique -> DB : gold → or, fuel → carburant, energy → energie
    const typeMap = {
      gold: 'or',
      metal: 'metal',
      fuel: 'carburant',
      energy: 'energie',
    };

    // Vérification des ressources
    for (const [resourceType, amount] of costs) {
      const dbType = typeMap[resourceType] || resourceType;

      const userResource = await Resource.findOne({
        where: { city_id: cityId, type: dbType },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!userResource) {
        const error = new Error(`Ressource ${resourceType} introuvable pour la recherche`);
        error.status = 404;
        throw error;
      }

      const currentAmount = Number(userResource.amount) || 0;
      if (currentAmount < Number(amount)) {
        const error = new Error('Ressources insuffisantes pour la recherche');
        error.status = 400;
        throw error;
      }
    }

    // Décrémentation des ressources
    for (const [resourceType, amount] of costs) {
      const dbType = typeMap[resourceType] || resourceType;

      const userResource = await Resource.findOne({
        where: { city_id: cityId, type: dbType },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!userResource) {
        const error = new Error(`Ressource ${resourceType} introuvable pour la recherche`);
        error.status = 404;
        throw error;
      }

      const currentAmount = Number(userResource.amount);
      const updatedAmount = currentAmount - Number(amount);
      const currentVersion = Number(userResource.version) || 0;

      const [affected] = await Resource.update(
        {
          amount: updatedAmount,
          version: currentVersion + 1,
        },
        {
          where: { id: userResource.id, version: currentVersion },
          transaction,
        },
      );

      assertOptimisticUpdate(affected);
      userResource.amount = updatedAmount;
      userResource.version = currentVersion + 1;
    }
  }

  async _emitQueue(cityId, userId) {
    const io = getIO();
    if (!io) return;

    const queue = await this.researchQueueRepository.findQueue(cityId);
    io.to(`user_${userId}`).emit(
      'research_queue:update',
      queue.map((item) => (item.toJSON ? item.toJSON() : item)),
    );
  }

  async _syncQueue(cityId, transaction) {
    await this.researchQueueRepository.syncQueue(cityId, transaction);
  }

  async _getQueueWithResearch(userId, transaction) {
    const city = await this._getMainCity(userId, { transaction });
    if (!city) return [];

    const researches = await this.Research.findAll({
      where: { user_id: userId },
      transaction,
    });
    const queue = await this.researchQueueRepository.findQueue(city.id, { transaction });
    const researchMap = new Map(researches.map((r) => [r.id, r]));

    return this._formatQueueItems(queue, researchMap);
  }

  async getAvailableResearch(userId) {
    const user = await this.User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const city = await this._getMainCity(userId);
    if (!city) {
      throw new Error('City not found');
    }

    // Récupérer les bâtiments/facilities du joueur
    const facilities = await this.Facility.findAll({ where: { city_id: city.id } });
    const userResearch = await this.Research.findAll({
      where: { user_id: userId },
    });
    const queue = await this.researchQueueRepository.findQueue(city.id);

    // Récupérer les recherches complétées
    const completedResearchMap = {};
    userResearch.forEach((r) => {
      if (r.level > 0) {
        completedResearchMap[r.name] = r.level;
      }
    });

    const completedIds = [];
    Object.values(RESEARCH_DEFINITIONS).forEach((def) => {
      if (completedResearchMap[def.name]) {
        completedIds.push(def.id);
      }
    });

    const researchById = new Map(userResearch.map((r) => [r.id, r]));
    const formattedQueue = this._formatQueueItems(queue, researchById);
    const inProgressIds = formattedQueue
      .filter((item) => item.status === 'in_progress' && item.researchKey)
      .map((item) => item.researchKey);

    const researchLab = facilities.find(
      (f) =>
        f.name === 'Laboratoire de Recherche' ||
        f.name === 'Research Lab' ||
        f.name === 'Labo de Recherche',
    );
    const trainingCenter = facilities.find(
      (f) =>
        f.name === "Centre d'Entraînement" ||
        f.name === "Terrain d'Entrainement",
    );
    const forge = facilities.find((f) => f.name === 'Forge Militaire');
    const commandCenter = facilities.find((f) => f.name === 'Centre de Commandement');
    const defenseWorkshop = facilities.find(
      (f) => f.name === 'Atelier de Défense' || f.name === 'Defense Workshop',
    );
    const powerPlant = facilities.find(
      (f) => f.name === 'Centrale Énergétique' || f.name === 'Power Plant',
    );

    const buildingLevels = {
      researchLab: researchLab?.level || 0,
      trainingCenter: trainingCenter?.level || 0,
      forge: forge?.level || 0,
      commandCenter: commandCenter?.level || 0,
      defenseWorkshop: defenseWorkshop?.level || 0,
      powerPlant: powerPlant?.level || 0,
    };

    const available = [];
    const completed = [];
    const inProgress = [];
    const locked = [];

    for (const research of Object.values(RESEARCH_DEFINITIONS)) {
      const checkResult = this._checkResearchRequirements(research, {
        buildingLevels,
        completedIds,
      });

      const researchData = {
        ...research,
        isCompleted: completedIds.includes(research.id),
        isInProgress: inProgressIds.includes(research.id),
        isAvailable:
          checkResult.isAvailable &&
          !completedIds.includes(research.id) &&
          !inProgressIds.includes(research.id),
        missingRequirements: checkResult.missingRequirements,
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
      available: available.sort(
        (a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id),
      ),
      inProgress,
      completed: completed.sort(
        (a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id),
      ),
      locked: locked.sort(
        (a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id),
      ),
      buildings: buildingLevels,
      categories: RESEARCH_CATEGORIES,
      queue: formattedQueue,
    };
  }

  async checkResearchAvailability(userId, researchId) {
    const research = RESEARCH_DEFINITIONS[researchId.toUpperCase()];
    if (!research) {
      throw new Error(`Research ${researchId} not found`);
    }

    const city = await this.City.findOne({
      where: { user_id: userId, is_capital: true },
    });
    if (!city) {
      throw new Error('City not found');
    }

    const facilities = await this.Facility.findAll({ where: { city_id: city.id } });
    const completedResearch = await this.Research.findAll({
      where: {
        user_id: userId,
      },
    });

    const completedIds = [];
    completedResearch.forEach((r) => {
      if (r.level > 0) {
        const def = Object.values(RESEARCH_DEFINITIONS).find((d) => d.name === r.name);
        if (def) {
          completedIds.push(def.id);
        }
      }
    });

    const researchLab = facilities.find(
      (f) =>
        f.name === 'Laboratoire de Recherche' ||
        f.name === 'Research Lab' ||
        f.name === 'Labo de Recherche',
    );
    const trainingCenter = facilities.find(
      (f) =>
        f.name === "Centre d'Entraînement" ||
        f.name === "Terrain d'Entrainement",
    );
    const forge = facilities.find((f) => f.name === 'Forge Militaire');
    const commandCenter = facilities.find((f) => f.name === 'Centre de Commandement');
    const defenseWorkshop = facilities.find(
      (f) => f.name === 'Atelier de Défense' || f.name === 'Defense Workshop',
    );
    const powerPlant = facilities.find(
      (f) => f.name === 'Centrale Énergétique' || f.name === 'Power Plant',
    );

    const buildingLevels = {
      researchLab: researchLab?.level || 0,
      trainingCenter: trainingCenter?.level || 0,
      forge: forge?.level || 0,
      commandCenter: commandCenter?.level || 0,
      defenseWorkshop: defenseWorkshop?.level || 0,
      powerPlant: powerPlant?.level || 0,
    };

    const checkResult = this._checkResearchRequirements(research, {
      buildingLevels,
      completedIds,
    });

    return {
      isAvailable: checkResult.isAvailable,
      reason: checkResult.isAvailable
        ? 'Research available'
        : checkResult.missingRequirements.join(', '),
      missingRequirements: checkResult.missingRequirements,
    };
  }

  _checkResearchRequirements(research, playerData) {
    const { buildingLevels, completedIds } = playerData;
    const missingRequirements = [];
    let isAvailable = true;

    if (research.requiredBuildings) {
      for (const [building, requiredLevel] of Object.entries(research.requiredBuildings)) {
        const playerLevel = buildingLevels[building] || 0;
        if (playerLevel < requiredLevel) {
          isAvailable = false;
          missingRequirements.push(
            `${this._getBuildingDisplayName(
              building,
            )} Niv ${requiredLevel} (actuellement: ${playerLevel})`,
          );
        }
      }
    }

    if (research.requiredResearch && research.requiredResearch.length > 0) {
      for (const reqId of research.requiredResearch) {
        if (!completedIds.includes(reqId)) {
          isAvailable = false;
          const reqResearch = RESEARCH_DEFINITIONS[reqId.toUpperCase()];
          missingRequirements.push(`Recherche: ${reqResearch?.name || reqId}`);
        }
      }
    }

    return {
      isAvailable,
      missingRequirements,
    };
  }

  _getBuildingDisplayName(buildingKey) {
    const names = {
      researchLab: 'Laboratoire de Recherche',
      trainingCenter: "Centre d'Entraînement",
      forge: 'Forge Militaire',
      commandCenter: 'Centre de Commandement',
      defenseWorkshop: 'Atelier de Défense',
      powerPlant: 'Centrale Énergétique',
    };
    return names[buildingKey] || buildingKey;
  }

  async getResearchByCategory(userId, category) {
    const allData = await this.getAvailableResearch(userId);
    const categoryFilter = (r) => r.category === category;

    return {
      available: allData.available.filter(categoryFilter),
      inProgress: allData.inProgress.filter(categoryFilter),
      completed: allData.completed.filter(categoryFilter),
      locked: allData.locked.filter(categoryFilter),
    };
  }

  async startResearch(userId, researchId) {
    const normalizedId = researchId.toUpperCase();
    const researchDef = RESEARCH_DEFINITIONS[normalizedId];

    if (!researchDef) {
      throw new Error(`Research definition not found: ${researchId}`);
    }

    // Utiliser l'ID de la définition (en minuscules)
    const techId = researchDef.id; // gardé si tu t'en sers ailleurs plus tard

    return this.sequelize.transaction(async (transaction) => {
      // On verrouille la ville principale
      const city = await this._getMainCity(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!city) {
        const error = new Error('City not found');
        error.status = 404;
        throw error;
      }

      const availabilityCheck = await this.checkResearchAvailability(userId, researchId);
      if (!availabilityCheck.isAvailable) {
        const error = new Error(`Research not available: ${availabilityCheck.reason}`);
        error.status = 400;
        throw error;
      }

      let research = await this.Research.findOne({
        where: {
          user_id: userId,
          name: researchDef.name,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!research) {
        research = await this.Research.create(
          {
            user_id: userId,
            name: researchDef.name,
            level: 0,
            nextlevelcost: sumCost(this._computeCostBreakdown(researchDef, 1)),
            description: researchDef.description || '',
          },
          { transaction },
        );
      }

      const pendingLevels = await this.researchQueueRepository.countPending(
        city.id,
        research.id,
        transaction,
      );
      const nextLevel = (Number(research.level) || 0) + pendingLevels + 1;
      const costBreakdown = this._computeCostBreakdown(researchDef, nextLevel);

      await this._ensureResources(city.id, costBreakdown, transaction);

      const durationSeconds = this._computeDurationSeconds(researchDef, nextLevel, city);
      const lastTask = await this.researchQueueRepository.getLastForCity(
        city.id,
        transaction,
      );

      const startTime = lastTask?.finishTime ? new Date(lastTask.finishTime) : new Date();
      const finishTime = new Date(startTime.getTime() + durationSeconds * 1000);

      const queueItem = await this.researchQueueRepository.create(
        {
          cityId: city.id,
          researchId: research.id,
          status: lastTask ? 'queued' : 'in_progress',
          startTime,
          finishTime,
          slot: lastTask ? lastTask.slot + 1 : 1,
        },
        transaction,
      );

      await this._syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        this._emitQueue(city.id, userId).catch(() => {});
      });

      return queueItem;
    });
  }

  async listResearchQueue(userId) {
    const city = await this._getMainCity(userId);
    if (!city) {
      const error = new Error('City not found');
      error.status = 404;
      throw error;
    }

    const researches = await this.Research.findAll({ where: { user_id: userId } });
    const queue = await this.researchQueueRepository.findQueue(city.id);
    const researchMap = new Map(researches.map((r) => [r.id, r]));

    return this._formatQueueItems(queue, researchMap);
  }

  async cancelResearch(userId, queueId) {
    return this.sequelize.transaction(async (transaction) => {
      const city = await this._getMainCity(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!city) {
        const error = new Error('City not found');
        error.status = 404;
        throw error;
      }

      const queueItem = await this.researchQueueRepository.findById(queueId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!queueItem || queueItem.cityId !== city.id) {
        const error = new Error('Recherche introuvable');
        error.status = 404;
        throw error;
      }

      if (queueItem.status === 'in_progress') {
        const error = new Error('Impossible d’annuler une recherche en cours');
        error.status = 400;
        throw error;
      }

      queueItem.status = 'cancelled';
      await queueItem.save({ transaction });

      await this._syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        this._emitQueue(city.id, userId).catch(() => {});
      });

      return queueItem.toJSON();
    });
  }

  async accelerateResearch(userId, queueId) {
    return this.sequelize.transaction(async (transaction) => {
      const city = await this._getMainCity(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!city) {
        const error = new Error('City not found');
        error.status = 404;
        throw error;
      }

      const queueItem = await this.researchQueueRepository.findById(queueId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!queueItem || queueItem.cityId !== city.id) {
        const error = new Error('Recherche introuvable');
        error.status = 404;
        throw error;
      }

      if (queueItem.status !== 'in_progress') {
        const error = new Error('Seule une recherche en cours peut être accélérée');
        error.status = 400;
        throw error;
      }

      queueItem.finishTime = new Date();
      await queueItem.save({ transaction });

      await this._syncQueue(city.id, transaction);

      transaction.afterCommit(() => {
        this._emitQueue(city.id, userId).catch(() => {});
      });

      return queueItem.toJSON();
    });
  }

  async _finalizeResearch(queueItem, transaction) {
    const research = await this.Research.findByPk(queueItem.researchId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!research) {
      queueItem.status = 'cancelled';
      await queueItem.save({ transaction });
      return null;
    }

    const researchDef = getDefinitionFromName(research.name);
    const currentLevel = Number(research.level) || 0;
    research.level = currentLevel + 1;

    const nextCost = researchDef
      ? this._computeCostBreakdown(researchDef, research.level + 1)
      : [];
    research.nextlevelcost = nextCost.length ? sumCost(nextCost) : research.nextlevelcost;
    research.date_modification = new Date();

    await research.save({ transaction });

    queueItem.status = 'completed';
    await queueItem.save({ transaction });
    await this._syncQueue(queueItem.cityId, transaction);

    return { research, researchDef };
  }

  async processResearchQueue() {
    const now = new Date();
    const expired = await ResearchQueue.findAll({
      where: {
        status: 'in_progress',
        finishTime: { [Op.lte]: now },
      },
      order: [['finishTime', 'ASC']],
    });

    for (const item of expired) {
      // eslint-disable-next-line no-await-in-loop
      await this.sequelize.transaction(async (transaction) => {
        const lockedItem = await this.researchQueueRepository.findById(item.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!lockedItem || lockedItem.status !== 'in_progress') return;

        const result = await this._finalizeResearch(lockedItem, transaction);
        if (!result) return;

        const city = await this.City.findByPk(lockedItem.cityId, { transaction });
        const userId = city?.user_id;

        transaction.afterCommit(() => {
          if (userId) {
            this._emitQueue(lockedItem.cityId, userId).catch(() => {});

            const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
            leaderboardIntegration.updateResearchScore(userId).catch(() => {});
            leaderboardIntegration.updateTotalPower(userId).catch(() => {});

            const battlePassService = require('../../battlepass/application/BattlePassService');
            battlePassService.addXP(userId, 50).catch(() => {});

            const achievementChecker = require('../../../utils/achievementChecker');
            achievementChecker.checkResearchAchievements(userId).catch(() => {});
          }
        });
      });
    }
  }
}

module.exports = ResearchUnlockService;
