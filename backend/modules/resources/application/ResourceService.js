const { Op } = require('sequelize');
const Resource = require('../../../models/Resource');
const Building = require('../../../models/Building');
const ResourceCost = require('../../../models/ResourceCost');
const Entity = require('../../../models/Entity');
const { getQueue, queueNames, serializeJobData } = require('../../../jobs/queueConfig');
const { getUserMainCity } = require('../../../utils/cityUtils');
const { getProductionPerSecond, getBuildDurationSeconds } = require('../../../utils/balancing');
const { calculateEnergyProduction } = require('../../../utils/resourceProduction');
const { transactionProvider: defaultTransactionProvider } = require('../infrastructure/transactionProvider');
const {
  RESOURCE_BUILDINGS,
  TYPE_TO_BUILDING_NAME,
  ENERGY_CONSUMPTION_PER_LEVEL,
  calculateStorageCapacities,
} = require('../domain/resourceRules');

class ResourceService {
  constructor({ transactionProvider = defaultTransactionProvider } = {}) {
    this.transactionProvider = transactionProvider;
  }

  assertOptimisticUpdate(updatedRows) {
    if (!updatedRows) {
      const error = new Error('Conflit concurrent détecté, veuillez réessayer.');
      error.status = 409;
      throw error;
    }
  }

  async withCity(userId, options = {}) {
    const city = await getUserMainCity(userId, options);
    if (!city) {
      const error = new Error('Aucune ville trouvée pour ce joueur.');
      error.status = 404;
      throw error;
    }
    return city;
  }

  async getBuildingEntityId(building, options = {}) {
    if (building.building_type_id) return building.building_type_id;

    const entity = await Entity.findOne({
      where: {
        entity_type: 'building',
        entity_name: building.name,
      },
      ...options,
    });

    if (!entity) {
      throw new Error(`Entity introuvable pour le bâtiment : ${building.name}`);
    }

    return entity.entity_id;
  }

  async reloadBuildingWithLock(cityId, buildingId, transaction) {
    return Building.findOne({
      where: { id: buildingId, city_id: cityId },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  }

  getBuildingState(building) {
    const start = building.build_start ? new Date(building.build_start) : null;
    const duration = Number(building.build_duration) || 0;
    const now = new Date();

    let status = 'idle';
    let constructionEndsAt = null;

    if (start && duration) {
      constructionEndsAt = new Date(start.getTime() + duration * 1000);
      status = constructionEndsAt > now ? 'in_progress' : 'ready';
    }

    const etaSeconds = constructionEndsAt
      ? Math.max(0, Math.ceil((constructionEndsAt.getTime() - now.getTime()) / 1000))
      : 0;

    return { status, constructionEndsAt, etaSeconds };
  }

  scheduleResourceUpgradeJob({ buildingId, userId, cityId, delayMs }) {
    const queue = getQueue(queueNames.RESOURCE_UPGRADE);

    return queue.add(
      'resource-building-upgrade',
      serializeJobData({ buildingId, userId, cityId }),
      {
        delay: Math.max(0, delayMs),
      }
    );
  }

  async getResourceBuildings(userId) {
    const city = await this.withCity(userId);

    let buildings = await Building.findAll({
      where: {
        city_id: city.id,
        name: {
          [Op.in]: RESOURCE_BUILDINGS,
        },
      },
      order: [['id', 'ASC']],
    });

    // Si aucun bâtiment n'existe, créer les bâtiments de base
    if (buildings.length === 0) {
      const defaultBuildings = [
        { name: "Mine d'or", level: 1 },
        { name: 'Mine de métal', level: 1 },
        { name: 'Extracteur', level: 1 },
        { name: 'Centrale électrique', level: 1 },
        { name: 'Hangar', level: 1 },
        { name: 'Réservoir', level: 1 }
      ];

      buildings = await Promise.all(
        defaultBuildings.map(b =>
          Building.create({
            city_id: city.id,
            name: b.name,
            level: b.level,
          })
        )
      );
    }

    return buildings.map((building) => {
      const { status, constructionEndsAt, etaSeconds } = this.getBuildingState(building);
      return {
        ...building.toJSON(),
        status,
        constructionEndsAt,
        remainingTime: etaSeconds,
      };
    });
  }

  async getResourceBuildingDetails(userId, buildingId) {
    const city = await this.withCity(userId);

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      const error = new Error('Bâtiment introuvable.');
      error.status = 404;
      throw error;
    }

    const { status, constructionEndsAt, etaSeconds } = this.getBuildingState(building);

    const currentLevel = Number(building.level) || 0;
    const nextLevel = currentLevel + 1;

    const entityId = await this.getBuildingEntityId(building);

    const costs = await ResourceCost.findAll({
      where: {
        entity_id: entityId,
        level: nextLevel,
      },
      order: [['resource_type', 'ASC']],
    });

    const nextLevelCost = costs.map((c) => ({
      resource_type: c.resource_type,
      amount: Number(c.amount),
    }));

    const production_rate = getProductionPerSecond(building.name, currentLevel);
    const next_production_rate = getProductionPerSecond(building.name, nextLevel);
    const buildDuration = getBuildDurationSeconds(nextLevel);

    return {
      id: building.id,
      city_id: building.city_id,
      name: building.name,
      level: currentLevel,
      build_start: building.build_start,
      build_duration: building.build_duration,
      status,
      constructionEndsAt,
      remainingTime: etaSeconds,
      production_rate,
      next_production_rate,
      buildDuration,
      nextLevelCost,
    };
  }

  async upgradeResourceBuilding(userId, buildingId) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await this.transactionProvider(async (transaction) => {
          const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
          let building = await this.reloadBuildingWithLock(city.id, buildingId, transaction);

          if (!building) {
            const error = new Error('Bâtiment introuvable.');
            error.status = 404;
            throw error;
          }

          const { status } = this.getBuildingState(building);

          if (status === 'in_progress') {
            const error = new Error('Construction déjà en cours pour ce bâtiment.');
            error.status = 400;
            throw error;
          }

          if (status === 'ready') {
            const currentVersion = Number(building.version) || 0;
            const [affected] = await Building.update(
              {
                build_start: null,
                build_duration: null,
                level: Number(building.level) + 1,
                version: currentVersion + 1,
              },
              {
                where: { id: building.id, version: currentVersion },
                transaction,
              }
            );
            this.assertOptimisticUpdate(affected);
            building = await this.reloadBuildingWithLock(city.id, buildingId, transaction);
          }

          const currentLevel = Number(building.level) || 0;
          const nextLevel = currentLevel + 1;

          const entityId = await this.getBuildingEntityId(building, { transaction });

          const costs = await ResourceCost.findAll({
            where: {
              entity_id: entityId,
              level: nextLevel,
            },
            transaction,
          });

          const resources = await Resource.findAll({
            where: { city_id: city.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          const resMap = new Map(resources.map((r) => [r.type, r]));
          for (const cost of costs) {
            const resource = resMap.get(cost.resource_type);
            const currentAmount = resource ? Number(resource.amount) || 0 : 0;

            if (currentAmount < Number(cost.amount)) {
              const error = new Error(`Ressources insuffisantes pour améliorer : ${building.name}.`);
              error.status = 400;
              throw error;
            }
          }

          for (const cost of costs) {
            const resource = resMap.get(cost.resource_type);
            const currentAmount = Number(resource.amount);
            const updatedAmount = currentAmount - Number(cost.amount);
            const currentVersion = Number(resource.version) || 0;

            const [affected] = await Resource.update(
              {
                amount: updatedAmount,
                version: currentVersion + 1,
              },
              {
                where: { id: resource.id, version: currentVersion },
                transaction,
              }
            );

            this.assertOptimisticUpdate(affected);
            resource.amount = updatedAmount;
            resource.version = currentVersion + 1;
          }

          const buildDuration = getBuildDurationSeconds(nextLevel);
          const currentVersion = Number(building.version) || 0;
          const build_start = new Date();

          const [affected, updatedBuildings] = await Building.update(
            {
              build_start,
              build_duration: buildDuration,
              version: currentVersion + 1,
            },
            {
              where: { id: building.id, version: currentVersion },
              transaction,
              returning: true,
            }
          );

          this.assertOptimisticUpdate(affected);
          const updatedBuilding = updatedBuildings?.[0] || (await this.reloadBuildingWithLock(city.id, buildingId, transaction));

          transaction.afterCommit(() =>
            this.scheduleResourceUpgradeJob({
              buildingId: updatedBuilding.id,
              userId,
              cityId: city.id,
              delayMs: buildDuration * 1000,
            })
          );

          return {
            message: 'Amélioration en cours.',
            id: updatedBuilding.id,
            name: updatedBuilding.name,
            level: Number(updatedBuilding.level) || currentLevel,
            build_start: updatedBuilding.build_start,
            build_duration: updatedBuilding.build_duration,
            buildDuration,
            status: 'in_progress',
            constructionEndsAt: updatedBuilding.constructionEndsAt,
          };
        });
      } catch (err) {
        if (err.status === 409 && attempt < 2) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Unable to upgrade building');
  }

  async downgradeResourceBuilding(userId, buildingId) {
    return this.transactionProvider(async (transaction) => {
      const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });
      const building = await Building.findOne({
        where: {
          id: buildingId,
          city_id: city.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!building) {
        const error = new Error('Bâtiment introuvable.');
        error.status = 404;
        throw error;
      }

      const { status } = this.getBuildingState(building);
      if (status === 'in_progress') {
        const error = new Error('Impossible de modifier un bâtiment en construction.');
        error.status = 400;
        throw error;
      }

      const nextLevel = building.level > 0 ? building.level - 1 : building.level;
      const currentVersion = Number(building.version) || 0;

      const [affected] = await Building.update(
        {
          build_start: null,
          build_duration: null,
          level: nextLevel,
          version: currentVersion + 1,
        },
        {
          where: { id: building.id, version: currentVersion },
          transaction,
        }
      );
      this.assertOptimisticUpdate(affected);
      return {
        ...building.toJSON(),
        level: nextLevel,
        build_start: null,
        build_duration: null,
        version: currentVersion + 1,
      };
    });
  }

  async destroyResourceBuilding(userId, buildingId) {
    const city = await this.withCity(userId);

    const building = await Building.findOne({
      where: {
        id: buildingId,
        city_id: city.id,
      },
    });

    if (!building) {
      const error = new Error('Bâtiment introuvable.');
      error.status = 404;
      throw error;
    }

    const { status } = this.getBuildingState(building);
    if (status === 'in_progress') {
      const error = new Error('Impossible de détruire un bâtiment en construction.');
      error.status = 400;
      throw error;
    }


    await building.destroy();
    return { message: 'Bâtiment détruit.' };
  }

  async finalizeResourceUpgrade(buildingId, userId) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await this.transactionProvider(async (transaction) => {
          const building = await Building.findOne({
            where: { id: buildingId },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!building) {
            const error = new Error('Bâtiment introuvable.');
            error.status = 404;
            throw error;
          }

          const { status, constructionEndsAt } = this.getBuildingState(building);

          if (status === 'idle') {
            return building;
          }

          if (status === 'in_progress' && constructionEndsAt && constructionEndsAt > new Date()) {
            const delayMs = constructionEndsAt.getTime() - Date.now();
            transaction.afterCommit(() =>
              this.scheduleResourceUpgradeJob({ buildingId, userId, cityId: building.city_id, delayMs })
            );
            return building;
          }

          const currentLevel = Number(building.level) || 0;
          const currentVersion = Number(building.version) || 0;
          const [affected, updatedBuildings] = await Building.update(
            {
              level: currentLevel + 1,
              build_start: null,
              build_duration: null,
              version: currentVersion + 1,
            },
            {
              where: { id: building.id, version: currentVersion },
              transaction,
              returning: true,
            }
          );

          this.assertOptimisticUpdate(affected);
          return updatedBuildings?.[0] || (await this.reloadBuildingWithLock(building.city_id, building.id, transaction));
        });
      } catch (err) {
        if (err.status === 409 && attempt < 2) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('Unable to finalize building upgrade');
  }

  async getUserResources(userId) {
    return this.transactionProvider(async (transaction) => {
      const city = await this.withCity(userId, { transaction, lock: transaction.LOCK.UPDATE });

      const resources = await Resource.findAll({
        where: { city_id: city.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const buildings = await Building.findAll({
        where: { city_id: city.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const buildingKey = (cityId, name) => `${cityId}::${name}`;
      const buildingMap = new Map();

      buildings.forEach((b) => {
        buildingMap.set(buildingKey(b.city_id, b.name), b);
      });

      const now = new Date();
      const results = [];
      const updates = [];
      const buildingUpdates = [];

      const effectiveLevelsByName = new Map();

      for (const building of buildings) {
        let effectiveLevel = Number(building.level) || 0;

        const { status, constructionEndsAt } = this.getBuildingState(building);

        if (status !== 'idle' && constructionEndsAt && constructionEndsAt <= now) {
          const currentVersion = Number(building.version) || 0;
          const [affected] = await Building.update(
            {
              build_start: null,
              build_duration: null,
              level: effectiveLevel + 1,
              version: currentVersion + 1,
            },
            {
              where: { id: building.id, version: currentVersion },
              transaction,
            }
          );

          this.assertOptimisticUpdate(affected);
          effectiveLevel += 1;
          building.build_start = null;
          building.build_duration = null;
          building.version = currentVersion + 1;
        }

        effectiveLevelsByName.set(building.name, effectiveLevel);
      }

      

      const hangarLevel = effectiveLevelsByName.get('Hangar') || 0;
      const reservoirLevel = effectiveLevelsByName.get('Réservoir') || 0;
      const centraleLevel = effectiveLevelsByName.get('Centrale électrique') || 0;

      const storageCapacities = calculateStorageCapacities({ hangarLevel, reservoirLevel, centraleLevel });

      const energyProduction = calculateEnergyProduction(centraleLevel);
      const energyConsumption = buildings
        .filter((b) => ['Mine de métal', "Mine d'or", 'Extracteur'].includes(b.name))
        .reduce((sum, b) => sum + Math.max(0, effectiveLevelsByName.get(b.name)) * ENERGY_CONSUMPTION_PER_LEVEL, 0);

      const energyResource = resources.find((r) => r.type === 'energie');
      const energyLastUpdate = energyResource?.last_update ? new Date(energyResource.last_update) : now;
      const energyDiffSec = Math.max(0, (now - energyLastUpdate) / 1000);
      const netEnergyRate = energyProduction - energyConsumption;
      const projectedEnergy = Math.max(0, Math.floor((Number(energyResource?.amount) || 0) + netEnergyRate * energyDiffSec));
      const cappedEnergy = Math.min(projectedEnergy, storageCapacities.energie || projectedEnergy);
      const hasEnergyForProduction = netEnergyRate >= 0 || cappedEnergy > 0;

      if (energyResource) {
        updates.push({
          id: energyResource.id,
          amount: cappedEnergy,
          last_update: now,
          production_rate: netEnergyRate,
        });
      }

      for (const resource of resources) {
        const type = resource.type;
        if (type === 'energie') continue;

        const prodBuildingName = TYPE_TO_BUILDING_NAME[type];
        const bKey = prodBuildingName ? buildingKey(resource.city_id, prodBuildingName) : null;
        const building = bKey ? buildingMap.get(bKey) : null;

        const lastUpdate = resource.last_update ? new Date(resource.last_update) : now;
        const diffSec = Math.max(0, (now - lastUpdate) / 1000);

        let amount = Number(resource.amount) || 0;
        let rate = 0;

        if (building) {
          const effectiveLevel = effectiveLevelsByName.get(building.name) || 0;
          rate = hasEnergyForProduction ? getProductionPerSecond(building.name, effectiveLevel) : 0;
          if (diffSec > 0) {
            const produced = rate * diffSec;
            amount += produced;
          }
        }

        const roundedAmount = Math.max(0, Math.floor(amount));
        const storageCap = storageCapacities[type];
        const cappedAmount = storageCap ? Math.min(roundedAmount, storageCap) : roundedAmount;

        updates.push({
          id: resource.id,
          amount: cappedAmount,
          last_update: now,
          production_rate: rate,
          level: building ? Number(effectiveLevelsByName.get(building.name)) || 0 : 0,
        });
      }

      for (const update of updates) {
        await Resource.update(
          {
            amount: update.amount,
            last_update: update.last_update,
          },
          {
            where: { id: update.id },
            transaction,
          }
        );

        results.push({
          id: update.id,
          city_id: city.id,
          type: resources.find((r) => r.id === update.id)?.type,
          amount: update.amount,
          last_update: update.last_update,
          level: update.level ?? 0,
          production_rate: update.production_rate ?? 0,
        });
      }

      return results;
    });
  }

  async saveUserResources(userId, resourcesPayload) {
    const city = await this.withCity(userId);

    const payload = Array.isArray(resourcesPayload) ? resourcesPayload : [];

    for (const resource of payload) {
      if (!resource.type) continue;

      await Resource.update(
        {
          amount: Number(resource.amount) || 0,
          last_update: new Date(),
        },
        {
          where: {
            city_id: city.id,
            type: resource.type,
          },
        }
      );
    }

    return { message: 'Ressources sauvegardées (backend maître).' };
  }

  getAllowedResourceBuildingNames() {
    return [...RESOURCE_BUILDINGS];
  }

  /**
   * Add resources to user's main city
   * @param {number} userId 
   * @param {Object} resources - { gold: 1000, metal: 500, fuel: 200, energy: 100 }
   * @param {Object} transaction - Sequelize transaction (optional)
   * @returns {Promise<Object>} - Updated resources
   */
  async addResourcesToUser(userId, resources, transaction = null) {
    const executeInTransaction = async (t) => {
      const city = await this.withCity(userId, { transaction: t, lock: t.LOCK.UPDATE });

      const resourceTypes = ['gold', 'metal', 'fuel', 'energy'];
      const updates = [];

      for (const type of resourceTypes) {
        const amount = resources[type];
        if (!amount || amount <= 0) continue;

        // Map frontend type to database type
        const dbType = type === 'gold' ? 'or' : type === 'metal' ? 'metal' : type === 'fuel' ? 'essence' : 'energie';

        let resource = await Resource.findOne({
          where: { city_id: city.id, type: dbType },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!resource) {
          // Create resource if it doesn't exist
          resource = await Resource.create({
            city_id: city.id,
            type: dbType,
            amount: Math.floor(amount),
            last_update: new Date(),
          }, { transaction: t });
        } else {
          const currentAmount = Number(resource.amount) || 0;
          const newAmount = currentAmount + Math.floor(amount);
          const currentVersion = Number(resource.version) || 0;

          const [affected] = await Resource.update(
            {
              amount: newAmount,
              last_update: new Date(),
              version: currentVersion + 1,
            },
            {
              where: { id: resource.id, version: currentVersion },
              transaction: t,
            }
          );

          this.assertOptimisticUpdate(affected);
          resource.amount = newAmount;
          resource.version = currentVersion + 1;
        }

        updates.push({ type, amount: Math.floor(amount), newTotal: resource.amount });
      }

      return { success: true, updates };
    };

    if (transaction) {
      return executeInTransaction(transaction);
    } else {
      return this.transactionProvider(executeInTransaction);
    }
  }

  /**
   * Deduct resources from user's main city
   * @param {number} userId 
   * @param {Object} resources - { gold: 1000, metal: 500, fuel: 200, energy: 100 }
   * @param {Object} transaction - Sequelize transaction (optional)
   * @returns {Promise<Object>} - Updated resources
   */
  async deductResourcesFromUser(userId, resources, transaction = null) {
    const executeInTransaction = async (t) => {
      const city = await this.withCity(userId, { transaction: t, lock: t.LOCK.UPDATE });

      const resourceTypes = ['gold', 'metal', 'fuel', 'energy'];
      const resourcesToDeduct = [];

      // First pass: validate all resources are sufficient
      for (const type of resourceTypes) {
        const amount = resources[type];
        if (!amount || amount <= 0) continue;

        const dbType = type === 'gold' ? 'or' : type === 'metal' ? 'metal' : type === 'fuel' ? 'essence' : 'energie';

        const resource = await Resource.findOne({
          where: { city_id: city.id, type: dbType },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!resource) {
          const error = new Error(`Ressource ${type} introuvable pour cet utilisateur.`);
          error.status = 404;
          throw error;
        }

        const currentAmount = Number(resource.amount) || 0;
        if (currentAmount < amount) {
          const error = new Error(`Ressources insuffisantes : ${type}. Requis: ${amount}, Disponible: ${currentAmount}`);
          error.status = 400;
          throw error;
        }

        resourcesToDeduct.push({ resource, type, amount: Math.floor(amount), dbType });
      }

      // Second pass: deduct resources
      const updates = [];
      for (const { resource, type, amount } of resourcesToDeduct) {
        const currentAmount = Number(resource.amount);
        const newAmount = currentAmount - amount;
        const currentVersion = Number(resource.version) || 0;

        const [affected] = await Resource.update(
          {
            amount: newAmount,
            last_update: new Date(),
            version: currentVersion + 1,
          },
          {
            where: { id: resource.id, version: currentVersion },
            transaction: t,
          }
        );

        this.assertOptimisticUpdate(affected);
        resource.amount = newAmount;
        resource.version = currentVersion + 1;

        updates.push({ type, amount, newTotal: newAmount });
      }

      return { success: true, updates };
    };

    if (transaction) {
      return executeInTransaction(transaction);
    } else {
      return this.transactionProvider(executeInTransaction);
    }
  }

  /**
   * Get user's current resource amounts (simplified)
   * @param {number} userId 
   * @returns {Promise<Object>} - { gold: 1000, metal: 500, fuel: 200, energy: 100 }
   */
  async getUserResourceAmounts(userId) {
    const city = await this.withCity(userId);

    const resources = await Resource.findAll({
      where: { city_id: city.id },
    });

    const amounts = { gold: 0, metal: 0, fuel: 0, energy: 0 };

    for (const resource of resources) {
      const type = resource.type;
      const amount = Number(resource.amount) || 0;

      if (type === 'or') amounts.gold = amount;
      else if (type === 'metal') amounts.metal = amount;
      else if (type === 'essence') amounts.fuel = amount;
      else if (type === 'energie') amounts.energy = amount;
    }

    return amounts;
  }
}

module.exports = ResourceService;