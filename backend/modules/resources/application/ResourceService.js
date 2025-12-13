const { Op } = require('sequelize');
const Resource = require('../../../models/Resource');
const Building = require('../../../models/Building');
const ResourceCost = require('../../../models/ResourceCost');
const ResourceProduction = require('../../../models/ResourceProduction');
const Entity = require('../../../models/Entity');
const ConstructionQueue = require('../../../models/ConstructionQueue');
const ProductionCalculatorService = require('./ProductionCalculatorService');
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
const { scheduleConstructionCompletion } = require('../../../jobs/constructionQueue');

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

    // Charger les statuts de construction depuis la queue
    const buildingIds = buildings.map(b => b.id);
    const entityIds = await Promise.all(
      buildings.map(b => this.getBuildingEntityId(b))
    );

    const queueItems = await ConstructionQueue.findAll({
      where: {
        cityId: city.id,
        type: 'building',
        status: { [Op.in]: ['queued', 'in_progress'] },
      },
    });

    const queueByEntityId = new Map();
    queueItems.forEach(item => {
      queueByEntityId.set(item.entityId, item);
    });

    return await Promise.all(buildings.map(async (building, index) => {
      const entityId = entityIds[index];
      const queueItem = queueByEntityId.get(entityId);

      let status = 'idle';
      let constructionEndsAt = null;
      let etaSeconds = 0;

      if (queueItem) {
        constructionEndsAt = queueItem.finishTime;
        // Map 'in_progress' to 'building' for frontend compatibility
        status = queueItem.status === 'in_progress' ? 'building' : 'queued';
        etaSeconds = constructionEndsAt
          ? Math.max(0, Math.ceil((new Date(constructionEndsAt) - new Date()) / 1000))
          : 0;
      }

      const currentLevel = Number(building.level) || 0;
      const nextLevel = currentLevel + 1;

      // Calculer les coûts pour le prochain niveau
      const costs = await ResourceCost.findAll({
        where: {
          entity_id: entityId,
          level: nextLevel,
        },
      });

      const costMap = {
        gold: 0,
        metal: 0,
        fuel: 0,
        energy: 0,
      };

      const typeMap = {
        'or': 'gold',
        'metal': 'metal',
        'carburant': 'fuel',
        'energie': 'energy',
      };

      costs.forEach(c => {
        const key = typeMap[c.resource_type];
        if (key) {
          costMap[key] = Number(c.amount);
        }
      });

      // Calculer la production ou capacité
      let production_rate = 0;
      let capacite = building.capacite || 0;

      if (building.name === 'Hangar') {
        const caps = calculateStorageCapacities({ hangarLevel: currentLevel });
        capacite = caps.or;
      } else if (building.name === 'Réservoir') {
        const caps = calculateStorageCapacities({ reservoirLevel: currentLevel });
        capacite = caps.carburant;
      } else if (building.name === 'Centrale électrique') {
        const caps = calculateStorageCapacities({ centraleLevel: currentLevel });
        capacite = caps.energie;
      } else {
        // Bâtiments de production
        const productionData = await ResourceProduction.findOne({
          where: { building_name: building.name, level: currentLevel },
        });
        if (productionData) {
          production_rate = parseFloat(productionData.production_rate);
        }
      }

      const buildDuration = getBuildDurationSeconds(nextLevel);

      return {
        ...building.toJSON(),
        status,
        constructionEndsAt,
        remainingTime: etaSeconds,
        production_rate,
        capacite,
        cost_gold: costMap.gold,
        cost_metal: costMap.metal,
        cost_fuel: costMap.fuel,
        cost_energy: costMap.energy,
        construction_time: buildDuration,
        max_level: 10, // À ajuster selon vos besoins
      };
    }));
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

    const currentLevel = Number(building.level) || 0;
    const nextLevel = currentLevel + 1;

    const entityId = await this.getBuildingEntityId(building);

    // Vérifier la construction queue
    const queueItem = await ConstructionQueue.findOne({
      where: {
        cityId: city.id,
        entityId: entityId,
        type: 'building',
        status: { [Op.in]: ['queued', 'in_progress'] },
      },
    });

    let status = 'idle';
    let constructionEndsAt = null;
    let etaSeconds = 0;

    if (queueItem) {
      constructionEndsAt = queueItem.finishTime;
      // Map 'in_progress' to 'building' for frontend compatibility
      status = queueItem.status === 'in_progress' ? 'building' : 'queued';
      etaSeconds = constructionEndsAt
        ? Math.max(0, Math.ceil((new Date(constructionEndsAt) - new Date()) / 1000))
        : 0;
    }

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

    // Récupérer la production depuis resource_production OU calculer la capacité de stockage
    let production_rate = 0;
    let next_production_rate = 0;
    let storage_capacity = null;
    let next_storage_capacity = null;

    // Bâtiments de stockage : calculer les capacités
    if (building.name === 'Hangar') {
      const currentCapacities = calculateStorageCapacities({ hangarLevel: currentLevel });
      const nextCapacities = calculateStorageCapacities({ hangarLevel: nextLevel });
      storage_capacity = {
        or: currentCapacities.or,
        metal: currentCapacities.metal,
      };
      next_storage_capacity = {
        or: nextCapacities.or,
        metal: nextCapacities.metal,
      };
      // Pour l'affichage, on met dans production_rate (le frontend l'utilise)
      production_rate = currentCapacities.or; // Capacité or/métal (identique)
      next_production_rate = nextCapacities.or;
    } else if (building.name === 'Réservoir') {
      const currentCapacities = calculateStorageCapacities({ reservoirLevel: currentLevel });
      const nextCapacities = calculateStorageCapacities({ reservoirLevel: nextLevel });
      storage_capacity = {
        carburant: currentCapacities.carburant,
      };
      next_storage_capacity = {
        carburant: nextCapacities.carburant,
      };
      production_rate = currentCapacities.carburant;
      next_production_rate = nextCapacities.carburant;
    } else if (building.name === 'Centrale électrique') {
      const currentCapacities = calculateStorageCapacities({ centraleLevel: currentLevel });
      const nextCapacities = calculateStorageCapacities({ centraleLevel: nextLevel });
      storage_capacity = {
        energie: currentCapacities.energie,
      };
      next_storage_capacity = {
        energie: nextCapacities.energie,
      };
      production_rate = currentCapacities.energie;
      next_production_rate = nextCapacities.energie;
    } else {
      // Bâtiments de production : lire depuis resource_production
      const currentProductionData = await ResourceProduction.findOne({
        where: { building_name: building.name, level: currentLevel },
      });
      if (currentProductionData) {
        production_rate = parseFloat(currentProductionData.production_rate) / 3600;
      }

      const nextProductionData = await ResourceProduction.findOne({
        where: { building_name: building.name, level: nextLevel },
      });
      if (nextProductionData) {
        next_production_rate = parseFloat(nextProductionData.production_rate) / 3600;
      }
    }

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
      storage_capacity,
      next_storage_capacity,
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

          // 🔒 SÉCURITÉ Style Ogame : Recalculer les ressources côté serveur AVANT de vérifier les coûts
          // Cela évite la triche et garantit que la production depuis last_update est prise en compte
          const Research = require('../../../models/Research');
          const Facility = require('../../../models/Facility');
          const City = require('../../../models/City');
          const productionCalc = new ProductionCalculatorService({
            Building,
            Research,
            Facility,
            City,
            ResourceProduction
          });
          const productionData = await productionCalc.calculateProductionRates(userId);

          const currentResources = await Resource.findAll({
            where: { city_id: city.id },
            transaction,
            lock: transaction.LOCK.UPDATE
          });

          const now = new Date();
          const typeMap = { 'or': 'gold', 'metal': 'metal', 'carburant': 'fuel', 'energie': 'energy' };

          // Recalculer et mettre à jour chaque ressource
          for (const resource of currentResources) {
            const lastUpdate = resource.last_update ? new Date(resource.last_update) : now;
            const elapsedSeconds = Math.max(0, (now - lastUpdate) / 1000);
            const prodKey = typeMap[resource.type];
            const productionPerSecond = productionData.production[prodKey] || 0;
            const storageCapacity = productionData.storage[prodKey] || 999999999;
            const produced = productionPerSecond * elapsedSeconds;
            const newAmount = Math.min(
              Math.floor(Number(resource.amount) + produced),
              storageCapacity
            );

            await Resource.update(
              { amount: newAmount, last_update: now },
              { where: { id: resource.id }, transaction }
            );
            resource.amount = newAmount; // Mettre à jour l'objet en mémoire
          }

          // Vérifier qu'il n'y a pas déjà une construction en cours
          const activeConstruction = await ConstructionQueue.findOne({
            where: {
              cityId: city.id,
              type: 'building',
              status: 'in_progress',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (activeConstruction) {
            const error = new Error('Une construction de bâtiment est déjà en cours. Attendez qu\'elle se termine.');
            error.status = 400;
            throw error;
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

          // Utiliser Date.now() en millisecondes pour éviter les conversions de timezone
          const nowMs = Date.now();
          const finishTimeMs = nowMs + buildDuration * 1000;

          // Créer une entrée dans la construction queue
          const queueItem = await ConstructionQueue.create({
            cityId: city.id,
            entityId: entityId,
            type: 'building',
            status: 'in_progress',
            startTime: new Date(nowMs),
            finishTime: new Date(finishTimeMs),
            slot: 1,
          }, { transaction });

          // Capturer l'ID et le finishTime avant le commit pour le retour
          const queueId = queueItem.id;
          const finishTime = queueItem.finishTime;

          transaction.afterCommit(async () => {
            try {
              // Relire le queueItem depuis la DB pour avoir les dates correctement formatées
              const committedItem = await ConstructionQueue.findByPk(queueId);
              
              if (!committedItem) {
                console.error(`[ResourceService] Cannot find construction queue item with id ${queueId} after commit`);
                return;
              }

              console.log(`[ResourceService] committedItem:`, JSON.stringify({
                id: committedItem.id,
                finishTime: committedItem.finishTime,
                startTime: committedItem.startTime,
                status: committedItem.status,
              }));
              
              const { getIO } = require('../../../socket');
              const io = getIO();
              if (io) {
                const queue = await ConstructionQueue.findAll({
                  where: { cityId: city.id },
                  order: [['slot', 'ASC']],
                });
                io.to(`user_${userId}`).emit('construction_queue:update', queue);
              }

              // Programmer la finalisation avec les données lues depuis la DB
              console.log(`[ResourceService] Scheduling construction completion for queueItem ${queueId}`);
              await scheduleConstructionCompletion({
                id: committedItem.id,
                finishTime: committedItem.finishTime,
              }, { userId });
              console.log(`[ResourceService] Successfully scheduled construction completion for queueItem ${queueId}`);
            } catch (err) {
              console.error(`[ResourceService] Error in afterCommit for queueItem ${queueId}:`, err);
            }
          });

          return {
            message: 'Construction démarrée.',
            queueId: queueItem.id,
            buildingId: building.id,
            buildingName: building.name,
            status: 'in_progress',
            finishTime: finishTime,
            buildDuration,
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

  async getUserResources(userId) {
    const { getLogger } = require('../../../utils/logger');
    const logger = getLogger({ module: 'ResourceService' });
    
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
      
      // Log le temps écoulé depuis la dernière mise à jour
      const oldestResource = resources.reduce((oldest, r) => {
        const lastUpdate = r.last_update ? new Date(r.last_update) : now;
        return !oldest || lastUpdate < oldest ? lastUpdate : oldest;
      }, null);
      
      if (oldestResource) {
        const offlineSeconds = Math.floor((now - oldestResource) / 1000);
        logger.debug({ userId, offlineSeconds }, 'Calculating offline production');
      }
      const results = [];
      const updates = [];
      const buildingUpdates = [];

      const effectiveLevelsByName = new Map();

      for (const building of buildings) {
        const effectiveLevel = Number(building.level) || 0;
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
          level: centraleLevel,
        });
      }

      // Ordre fixe des ressources : metal, or, carburant
      const orderedTypes = ['metal', 'or', 'carburant'];
      
      for (const type of orderedTypes) {
        const resource = resources.find(r => r.type === type);
        if (!resource) continue;

        const prodBuildingName = TYPE_TO_BUILDING_NAME[type];
        const bKey = prodBuildingName ? buildingKey(resource.city_id, prodBuildingName) : null;
        const building = bKey ? buildingMap.get(bKey) : null;

        const lastUpdate = resource.last_update ? new Date(resource.last_update) : now;
        const diffSec = Math.max(0, (now - lastUpdate) / 1000);

        let amount = Number(resource.amount) || 0;
        let rate = 0;

        if (building && hasEnergyForProduction) {
          const effectiveLevel = effectiveLevelsByName.get(building.name) || 0;
          
          // Récupérer le taux de production depuis la table resource_production
          const productionData = await ResourceProduction.findOne({
            where: {
              building_name: building.name,
              level: effectiveLevel
            },
            transaction
          });
          
          if (productionData) {
            // production_rate est par heure dans la table, convertir en par seconde
            rate = parseFloat(productionData.production_rate) / 3600;
          } else {
            // Fallback sur l'ancienne méthode si pas de données
            rate = getProductionPerSecond(building.name, effectiveLevel);
          }
          
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

        const resourceType = resources.find((r) => r.id === update.id)?.type;
        results.push({
          id: update.id,
          city_id: city.id,
          type: resourceType,
          amount: update.amount,
          last_update: update.last_update,
          level: update.level ?? 0,
          production_rate: update.production_rate ?? 0,
          storage_capacity: storageCapacities[resourceType] || 0,
        });
      }

      // Trier les résultats dans l'ordre : energie, metal, or, carburant
      const typeOrder = { energie: 0, metal: 1, or: 2, carburant: 3 };
      results.sort((a, b) => (typeOrder[a.type] ?? 999) - (typeOrder[b.type] ?? 999));

      return results;
    });
  }

  async saveUserResources(userId, resourcesPayload) {
    // ⚠️ SÉCURITÉ : Ne JAMAIS faire confiance aux valeurs envoyées par le client !
    // À la place, on recalcule la production côté serveur depuis last_update
    
    const city = await this.withCity(userId);

    // Récupérer les ressources actuelles avec leur last_update
    const currentResources = await Resource.findAll({
      where: { city_id: city.id }
    });

    // Récupérer les taux de production réels depuis les bâtiments
    const buildings = await Building.findAll({
      where: { city_id: city.id }
    });

    // Importer ProductionCalculatorService pour calculer la vraie production
    const ProductionCalculatorService = require('./ProductionCalculatorService');
    const productionCalc = new ProductionCalculatorService();
    
    const researches = []; // TODO: récupérer si nécessaire
    const facilities = []; // TODO: récupérer si nécessaire
    
    const productionData = await productionCalc.calculateProduction(buildings, researches, facilities);

    const now = new Date();
    const updatedResources = [];

    for (const resource of currentResources) {
      const lastUpdate = resource.last_update ? new Date(resource.last_update) : now;
      const elapsedSeconds = Math.max(0, (now - lastUpdate) / 1000);

      // Mapper les types
      const typeMap = {
        'or': 'gold',
        'metal': 'metal',
        'carburant': 'fuel',
        'energie': 'energy'
      };
      
      const prodKey = typeMap[resource.type];
      const productionPerSecond = productionData.production[prodKey] || 0;
      const storageCapacity = productionData.storage[prodKey] || 999999999;

      // Calculer la nouvelle quantité (production depuis last_update)
      const produced = productionPerSecond * elapsedSeconds;
      const newAmount = Math.min(
        Math.floor(Number(resource.amount) + produced),
        storageCapacity
      );

      await Resource.update(
        {
          amount: newAmount,
          last_update: now,
        },
        {
          where: {
            id: resource.id,
          },
        }
      );

      updatedResources.push({
        type: resource.type,
        amount: newAmount,
        produced: Math.floor(produced)
      });
    }

    console.log(`✅ Ressources calculées côté serveur pour user ${userId}:`, updatedResources);

    return { 
      message: 'Ressources recalculées (backend maître).', 
      resources: updatedResources 
    };
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
        const dbType = type === 'gold' ? 'or' : type === 'metal' ? 'metal' : type === 'fuel' ? 'carburant' : 'energie';

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

        const dbType = type === 'gold' ? 'or' : type === 'metal' ? 'metal' : type === 'fuel' ? 'carburant' : 'energie';

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
   * Finaliser l'amélioration d'un resource building depuis la queue
   * Appelé automatiquement par le worker quand le timer est écoulé
   * @param {number} queueId - ID de l'entrée dans la construction queue
   * @param {number} userId - ID du joueur (optionnel)
   * @returns {Promise<Object>}
   */
  async finalizeResourceUpgrade(queueId, userId = null) {
    return this.transactionProvider(async (transaction) => {
      const queueItem = await ConstructionQueue.findOne({
        where: { id: queueId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!queueItem) {
        throw new Error(`Queue item ${queueId} not found`);
      }

      if (queueItem.status !== 'in_progress') {
        console.log(`[ResourceService] Queue item ${queueId} already in status ${queueItem.status}`);
        return { message: 'Already processed', status: queueItem.status };
      }

      // Vérifier que le timer est écoulé
      const now = new Date();
      if (queueItem.finishTime > now) {
        const error = new Error('Construction not finished yet');
        error.status = 400;
        throw error;
      }

      // Récupérer l'entité pour trouver le building
      const entity = await Entity.findOne({
        where: { entity_id: queueItem.entityId },
        transaction
      });

      if (!entity) {
        throw new Error(`Entity ${queueItem.entityId} not found`);
      }

      // Récupérer le building
      const building = await Building.findOne({
        where: {
          city_id: queueItem.cityId,
          name: entity.entity_name
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!building) {
        throw new Error(`Building ${entity.entity_name} not found in city ${queueItem.cityId}`);
      }

      // Upgrader le niveau
      const currentVersion = Number(building.version) || 0;
      const [affected] = await Building.update(
        {
          level: building.level + 1,
          version: currentVersion + 1,
          build_start: null,
          build_duration: null,
        },
        {
          where: { id: building.id, version: currentVersion },
          transaction
        }
      );

      this.assertOptimisticUpdate(affected);

      // Marquer la queue comme completed
      queueItem.status = 'completed';
      await queueItem.save({ transaction });

      console.log(`[ResourceService] Resource building ${building.name} upgraded to level ${building.level + 1}`);

      // Après commit, émettre l'événement socket et mettre à jour les leaderboards
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

          // Mettre à jour les leaderboards
          if (userId) {
            const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
            leaderboardIntegration.updateBuildingsScore(userId).catch(err => {
              console.error('Error updating buildings leaderboard:', err);
            });
            leaderboardIntegration.updateTotalPower(userId).catch(err => {
              console.error('Error updating total power leaderboard:', err);
            });
          }
        } catch (err) {
          console.error('[ResourceService] Error in afterCommit:', err);
        }
      });

      return {
        message: 'Resource building upgrade completed',
        building: {
          id: building.id,
          name: building.name,
          level: building.level + 1
        }
      };
    });
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
      else if (type === 'carburant') amounts.fuel = amount;
      else if (type === 'energie') amounts.energy = amount;
    }

    return amounts;
  }
}

module.exports = ResourceService;