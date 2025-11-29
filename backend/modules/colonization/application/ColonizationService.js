const { getLogger } = require('../../../utils/logger');
const sequelize = require('../../../db');
const City = require('../../../models/City');
const Building = require('../../../models/Building');
const Resource = require('../../../models/Resource');
const Unit = require('../../../models/Unit');
const Research = require('../../../models/Research');
const Entity = require('../../../models/Entity');
const {
  calculateDistance,
  calculateTravelTime,
  getColonizationCost,
} = require('../../world/domain/worldRules');

const logger = getLogger({ module: 'ColonizationService' });

// Nombre maximum de missions de colonisation simultanées
const MAX_CONCURRENT_MISSIONS = 3;

// Unité requise pour coloniser
const COLONIST_UNIT_NAME = 'Colon';

/**
 * ColonizationService - Service métier pour la colonisation
 */
class ColonizationService {
  constructor({ colonizationRepository, worldRepository }) {
    this.colonizationRepository = colonizationRepository;
    this.worldRepository = worldRepository;
  }

  /**
   * Récupère le nombre maximum de villes autorisé par les technologies
   */
  async getMaxCitiesLimit(userId) {
    const researches = await Research.findAll({
      where: { user_id: userId },
      attributes: ['name', 'level'],
    });

    let maxCities = 1; // Par défaut: 1 ville (capitale)

    researches.forEach((research) => {
      switch (research.name) {
        case 'Colonisation I':
          maxCities = Math.max(maxCities, 2);
          break;
        case 'Colonisation II':
          maxCities = Math.max(maxCities, 3);
          break;
        case 'Colonisation III':
          maxCities = Math.max(maxCities, 5);
          break;
        case 'Empire Étendu':
          maxCities = Math.max(maxCities, 10);
          break;
        case 'Domination Totale':
          maxCities = Math.max(maxCities, 20);
          break;
      }
    });

    return maxCities;
  }

  /**
   * Démarre une mission de colonisation
   */
  async startColonization(userId, departureCityId, targetSlotId) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Vérifier la limite de villes
      const currentCityCount = await City.count({
        where: { user_id: userId },
        transaction,
      });

      const maxCities = await this.getMaxCitiesLimit(userId);

      if (currentCityCount >= maxCities) {
        const error = new Error(
          `Limite de villes atteinte (${maxCities}). Recherchez des technologies de colonisation.`
        );
        error.status = 400;
        throw error;
      }

      // 2. Vérifier le nombre de missions actives
      const activeMissions = await this.colonizationRepository.countActiveMissionsByUser(
        userId
      );

      if (activeMissions >= MAX_CONCURRENT_MISSIONS) {
        const error = new Error(
          `Vous avez déjà ${MAX_CONCURRENT_MISSIONS} missions de colonisation en cours.`
        );
        error.status = 400;
        throw error;
      }

      // 3. Vérifier que la ville de départ appartient au joueur
      const departureCity = await City.findOne({
        where: {
          id: departureCityId,
          user_id: userId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!departureCity) {
        const error = new Error('Ville de départ introuvable ou non autorisée.');
        error.status = 404;
        throw error;
      }

      if (!departureCity.coord_x || !departureCity.coord_y) {
        const error = new Error('La ville de départ n\'a pas de coordonnées valides.');
        error.status = 400;
        throw error;
      }

      // 4. Vérifier que le slot cible est libre et existe
      const targetSlot = await this.worldRepository.getCitySlotById(targetSlotId);

      if (!targetSlot || targetSlot.status !== 'free') {
        const error = new Error('Cet emplacement n\'est pas disponible pour la colonisation.');
        error.status = 400;
        throw error;
      }

      // Vérifier qu'il n'y a pas déjà une mission vers ce slot
      const hasPending = await this.colonizationRepository.hasPendingMissionToSlot(
        targetSlotId
      );

      if (hasPending) {
        const error = new Error('Une mission de colonisation est déjà en cours vers cet emplacement.');
        error.status = 400;
        throw error;
      }

      // 5. Récupérer les coordonnées du slot cible
      const targetGrid = await this.worldRepository.getGridTileByCoords(
        targetSlot.grid?.coord_x,
        targetSlot.grid?.coord_y
      );

      if (!targetGrid) {
        const error = new Error('Coordonnées du slot cible introuvables.');
        error.status = 500;
        throw error;
      }

      // 6. Calculer la distance et le coût
      const distance = calculateDistance(
        departureCity.coord_x,
        departureCity.coord_y,
        targetGrid.coord_x,
        targetGrid.coord_y
      );

      const cost = getColonizationCost(distance, targetSlot.quality);
      const travelTimeSeconds = calculateTravelTime(distance, 2); // 2 cases/heure

      // 7. Vérifier les ressources
      const cityResources = await Resource.findAll({
        where: { city_id: departureCityId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const resourceMap = {};
      cityResources.forEach((r) => {
        resourceMap[r.type] = Number(r.amount) || 0;
      });

      // Vérifier chaque ressource requise
      for (const [resourceType, amount] of Object.entries(cost)) {
        if ((resourceMap[resourceType] || 0) < amount) {
          const error = new Error(
            `Ressources insuffisantes: ${amount} ${resourceType} requis, ${resourceMap[resourceType] || 0} disponible.`
          );
          error.status = 400;
          throw error;
        }
      }

      // 8. Vérifier la présence d'au moins 1 colon
      const colonistEntity = await Entity.findOne({
        where: { name: COLONIST_UNIT_NAME, entity_type: 'unit' },
        transaction,
      });

      if (!colonistEntity) {
        const error = new Error('L\'unité "Colon" n\'existe pas dans le jeu.');
        error.status = 500;
        throw error;
      }

      const colonistUnit = await Unit.findOne({
        where: {
          city_id: departureCityId,
          name: COLONIST_UNIT_NAME,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!colonistUnit || colonistUnit.quantity < 1) {
        const error = new Error(
          `Vous devez avoir au moins 1 ${COLONIST_UNIT_NAME} dans votre ville pour coloniser.`
        );
        error.status = 400;
        throw error;
      }

      // 9. Déduire les ressources
      for (const [resourceType, amount] of Object.entries(cost)) {
        await Resource.update(
          {
            amount: sequelize.literal(`amount - ${amount}`),
            last_update: new Date(),
          },
          {
            where: {
              city_id: departureCityId,
              type: resourceType,
            },
            transaction,
          }
        );
      }

      // 10. Déduire 1 colon
      await Unit.update(
        {
          quantity: sequelize.literal('quantity - 1'),
        },
        {
          where: {
            city_id: departureCityId,
            name: COLONIST_UNIT_NAME,
          },
          transaction,
        }
      );

      // 11. Réserver le slot
      await this.worldRepository.updateCitySlotStatus(
        targetSlotId,
        'reserved',
        null,
        transaction
      );

      // 12. Créer la mission
      const now = new Date();
      const arrivalDate = new Date(now.getTime() + travelTimeSeconds * 1000);

      const mission = await this.colonizationRepository.createMission(
        {
          user_id: userId,
          departure_city_id: departureCityId,
          target_slot_id: targetSlotId,
          colonist_count: 1,
          status: 'traveling',
          departure_at: now,
          arrival_at: arrivalDate,
        },
        transaction
      );

      await transaction.commit();

      logger.info(
        { userId, missionId: mission.id, distance, travelTimeSeconds },
        'Colonization mission started'
      );

      return {
        mission: {
          id: mission.id,
          status: 'traveling',
          departureAt: mission.departure_at,
          arrivalAt: mission.arrival_at,
          distance,
          travelTime: travelTimeSeconds,
        },
        cost,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ err: error, userId, departureCityId, targetSlotId }, 'Error starting colonization');
      throw error;
    }
  }

  /**
   * Récupère les missions de colonisation d'un joueur
   */
  async getUserMissions(userId, statusFilter = null) {
    try {
      const missions = await this.colonizationRepository.getMissionsByUser(
        userId,
        statusFilter
      );

      return missions.map((m) => ({
        id: m.id,
        status: m.status,
        departureCity: m.departureCity
          ? { id: m.departureCity.id, name: m.departureCity.name }
          : null,
        targetCoords: m.targetSlot?.grid
          ? { x: m.targetSlot.grid.coord_x, y: m.targetSlot.grid.coord_y }
          : null,
        colonistCount: m.colonist_count,
        departureAt: m.departure_at,
        arrivalAt: m.arrival_at,
        completedAt: m.completed_at,
        remainingTime: m.status === 'traveling'
          ? Math.max(0, Math.floor((new Date(m.arrival_at) - new Date()) / 1000))
          : 0,
      }));
    } catch (error) {
      logger.error({ err: error, userId }, 'Error getting user missions');
      throw error;
    }
  }

  /**
   * Annule une mission de colonisation en cours
   */
  async cancelMission(userId, missionId) {
    const transaction = await sequelize.transaction();

    try {
      const mission = await this.colonizationRepository.getMissionById(missionId);

      if (!mission) {
        const error = new Error('Mission introuvable.');
        error.status = 404;
        throw error;
      }

      if (mission.user_id !== userId) {
        const error = new Error('Cette mission ne vous appartient pas.');
        error.status = 403;
        throw error;
      }

      if (mission.status !== 'traveling') {
        const error = new Error('Seules les missions en cours peuvent être annulées.');
        error.status = 400;
        throw error;
      }

      // Annuler la mission
      const cancelled = await this.colonizationRepository.cancelMission(
        missionId,
        userId,
        transaction
      );

      if (!cancelled) {
        const error = new Error('Impossible d\'annuler la mission.');
        error.status = 500;
        throw error;
      }

      // Libérer le slot
      await this.worldRepository.updateCitySlotStatus(
        mission.target_slot_id,
        'free',
        null,
        transaction
      );

      // Rembourser partiellement (50% des ressources et 1 colon)
      const targetGrid = mission.targetSlot?.grid;
      if (targetGrid) {
        const distance = calculateDistance(
          mission.departureCity.coord_x,
          mission.departureCity.coord_y,
          targetGrid.coord_x,
          targetGrid.coord_y
        );

        const cost = getColonizationCost(distance, mission.targetSlot.quality);

        // Rembourser 50%
        for (const [resourceType, amount] of Object.entries(cost)) {
          const refund = Math.floor(amount * 0.5);
          await Resource.update(
            {
              amount: sequelize.literal(`amount + ${refund}`),
              last_update: new Date(),
            },
            {
              where: {
                city_id: mission.departure_city_id,
                type: resourceType,
              },
              transaction,
            }
          );
        }

        // Rendre le colon
        await Unit.update(
          {
            quantity: sequelize.literal('quantity + 1'),
          },
          {
            where: {
              city_id: mission.departure_city_id,
              name: COLONIST_UNIT_NAME,
            },
            transaction,
          }
        );
      }

      await transaction.commit();

      logger.info({ userId, missionId }, 'Colonization mission cancelled');

      return { message: 'Mission annulée avec succès (50% des ressources remboursées).' };
    } catch (error) {
      await transaction.rollback();
      logger.error({ err: error, userId, missionId }, 'Error cancelling mission');
      throw error;
    }
  }

  /**
   * Finalise une mission de colonisation (appelé par worker)
   * Crée la nouvelle ville
   */
  async finalizeMission(missionId) {
    const transaction = await sequelize.transaction();

    try {
      const mission = await this.colonizationRepository.getMissionById(missionId);

      if (!mission || mission.status !== 'traveling') {
        logger.warn({ missionId }, 'Mission not found or not in traveling status');
        return null;
      }

      // Vérifier que l'heure d'arrivée est passée
      if (new Date() < new Date(mission.arrival_at)) {
        logger.warn({ missionId }, 'Mission not yet arrived');
        return null;
      }

      const targetGrid = mission.targetSlot?.grid;
      if (!targetGrid) {
        throw new Error('Target grid not found for mission');
      }

      // Créer la nouvelle ville
      const newCity = await City.create(
        {
          user_id: mission.user_id,
          name: `Colonie ${targetGrid.coord_x},${targetGrid.coord_y}`,
          is_capital: false,
          coord_x: targetGrid.coord_x,
          coord_y: targetGrid.coord_y,
          vision_range: 5,
          founded_at: new Date(),
        },
        { transaction }
      );

      // Initialiser les ressources de base pour la nouvelle ville
      const initialResources = [
        { type: 'or', amount: 500 },
        { type: 'metal', amount: 500 },
        { type: 'carburant', amount: 300 },
        { type: 'energie', amount: 0 },
      ];

      for (const res of initialResources) {
        await Resource.create(
          {
            city_id: newCity.id,
            type: res.type,
            amount: res.amount,
            last_update: new Date(),
          },
          { transaction }
        );
      }

      // Créer les bâtiments de base niveau 0
      const basicBuildings = [
        "Mine d'or",
        'Mine de métal',
        'Extracteur',
        'Centrale électrique',
        'Hangar',
        'Réservoir',
      ];

      for (const buildingName of basicBuildings) {
        const entity = await Entity.findOne({
          where: { name: buildingName, entity_type: 'building' },
          transaction,
        });

        if (entity) {
          await Building.create(
            {
              city_id: newCity.id,
              name: buildingName,
              level: 0,
              capacite: 0,
              building_type_id: entity.entity_id,
            },
            { transaction }
          );
        }
      }

      // Mettre à jour le city_slot
      await this.worldRepository.updateCitySlotStatus(
        mission.target_slot_id,
        'occupied',
        newCity.id,
        transaction
      );

      // Mettre à jour le statut de la mission
      await this.colonizationRepository.updateMissionStatus(
        missionId,
        'completed',
        new Date(),
        transaction
      );

      await transaction.commit();

      logger.info(
        { missionId, userId: mission.user_id, newCityId: newCity.id },
        'Colonization mission completed'
      );

      return {
        cityId: newCity.id,
        cityName: newCity.name,
        coords: { x: newCity.coord_x, y: newCity.coord_y },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error({ err: error, missionId }, 'Error finalizing colonization mission');
      throw error;
    }
  }
}

module.exports = ColonizationService;
