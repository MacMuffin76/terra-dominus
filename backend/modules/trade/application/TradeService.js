const { runWithContext } = require('../../../utils/logger');
const worldRules = require('../../world/domain/worldRules');
const NotificationService = require('../../../services/NotificationService');

/**
 * TradeService - Gestion du commerce inter-villes
 */
class TradeService {
  constructor({ tradeRepository, City, Resource, sequelize }) {
    this.tradeRepository = tradeRepository;
    this.City = City;
    this.Resource = Resource;
    this.sequelize = sequelize;
  }

  /**
   * Établir une route commerciale entre deux villes
   */
  async establishTradeRoute(userId, routeData) {
    return runWithContext(async () => {
      const { originCityId, destinationCityId, routeType, autoTransferConfig } = routeData;

      const transaction = await this.sequelize.transaction();

      try {
        // 1. Vérifications
        const originCity = await this.City.findByPk(originCityId, { transaction });
        const destinationCity = await this.City.findByPk(destinationCityId, { transaction });

        if (!originCity || originCity.user_id !== userId) {
          throw new Error('Ville d\'origine invalide');
        }

        if (!destinationCity) {
          throw new Error('Ville de destination introuvable');
        }

        if (routeType === 'internal' && destinationCity.user_id !== userId) {
          throw new Error('Les routes internes doivent relier vos propres villes');
        }

        if (originCityId === destinationCityId) {
          throw new Error('Impossible de créer une route vers la même ville');
        }

        // 2. Vérifier qu'une route n'existe pas déjà
        const existingRoute = await this.tradeRepository.getUserTradeRoutes(userId);
        const duplicate = existingRoute.find(
          r => r.origin_city_id === originCityId && r.destination_city_id === destinationCityId
        );

        if (duplicate) {
          throw new Error('Une route existe déjà entre ces villes');
        }

        // 3. Calculer la distance
        const distance = worldRules.calculateDistance(
          originCity.coord_x,
          originCity.coord_y,
          destinationCity.coord_x,
          destinationCity.coord_y
        );

        // 4. Créer la route
        const route = await this.tradeRepository.createTradeRoute(
          {
            owner_user_id: userId,
            origin_city_id: originCityId,
            destination_city_id: destinationCityId,
            route_type: routeType,
            status: 'active',
            distance,
            ...autoTransferConfig
          },
          transaction
        );

        await transaction.commit();

        return route;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Envoyer un convoi manuel
   */
  async sendConvoy(userId, convoyData) {
    return runWithContext(async () => {
      const { routeId, cargo, escortUnits } = convoyData;

      const transaction = await this.sequelize.transaction();

      try {
        // 1. Vérifier la route
        const route = await this.tradeRepository.getTradeRouteById(routeId);

        if (!route || route.owner_user_id !== userId) {
          throw new Error('Route commerciale introuvable ou non autorisée');
        }

        if (route.status !== 'active') {
          throw new Error('Route inactive');
        }

        // 2. Vérifier et déduire les ressources
        const originResources = await this.Resource.findOne({
          where: { city_id: route.origin_city_id },
          transaction
        });

        if (originResources.gold < cargo.gold || 
            originResources.metal < cargo.metal || 
            originResources.fuel < cargo.fuel) {
          throw new Error('Ressources insuffisantes dans la ville d\'origine');
        }

        originResources.gold -= cargo.gold;
        originResources.metal -= cargo.metal;
        originResources.fuel -= cargo.fuel;
        await originResources.save({ transaction });

        // 3. Calculer le temps de trajet (convois plus lents que les armées)
        const convoySpeed = 1.5; // tiles/h
        const travelTimeHours = route.distance / convoySpeed;
        const travelTimeSeconds = Math.ceil(travelTimeHours * 3600);
        const departureTime = new Date();
        const arrivalTime = new Date(departureTime.getTime() + travelTimeSeconds * 1000);

        // 4. Créer le convoi
        const convoy = await this.tradeRepository.createConvoy(
          {
            trade_route_id: routeId,
            origin_city_id: route.origin_city_id,
            destination_city_id: route.destination_city_id,
            status: 'traveling',
            cargo_gold: cargo.gold,
            cargo_metal: cargo.metal,
            cargo_fuel: cargo.fuel,
            escort_units: escortUnits || null,
            departure_time: departureTime,
            arrival_time: arrivalTime,
            distance: route.distance
          },
          transaction
        );

        // 5. Mettre à jour les stats de la route
        await this.tradeRepository.updateTradeRoute(
          routeId,
          {
            total_convoys: route.total_convoys + 1,
            last_convoy_time: departureTime
          },
          transaction
        );

        await transaction.commit();

        // Notification convoy envoyé
        NotificationService.notifyConvoySent(userId, {
          convoyId: convoy.id,
          destinationCityName: route.destinationCity.name,
          cargo,
          arrivalTime
        });

        return {
          convoyId: convoy.id,
          arrivalTime,
          travelTime: travelTimeSeconds
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Finaliser l'arrivée d'un convoi (appelé par le worker)
   */
  async finalizeConvoyArrival(convoyId) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        const convoy = await this.tradeRepository.getConvoyById(convoyId);

        if (!convoy || convoy.status !== 'traveling') {
          throw new Error('Convoi invalide');
        }

        // Ajouter les ressources à la destination
        const destResources = await this.Resource.findOne({
          where: { city_id: convoy.destination_city_id },
          transaction
        });

        destResources.gold += convoy.cargo_gold;
        destResources.metal += convoy.cargo_metal;
        destResources.fuel += convoy.cargo_fuel;
        await destResources.save({ transaction });

        // Mettre à jour le convoi
        await this.tradeRepository.updateConvoy(
          convoyId,
          { status: 'arrived' },
          transaction
        );

        // Mettre à jour les stats de la route
        const route = convoy.route;
        await this.tradeRepository.updateTradeRoute(
          route.id,
          {
            total_gold_traded: parseInt(route.total_gold_traded) + convoy.cargo_gold,
            total_metal_traded: parseInt(route.total_metal_traded) + convoy.cargo_metal,
            total_fuel_traded: parseInt(route.total_fuel_traded) + convoy.cargo_fuel
          },
          transaction
        );

        await transaction.commit();

        // Notification convoy arrivé
        const destinationCity = await this.City.findByPk(convoy.destination_city_id);
        NotificationService.notifyConvoyArrived(destinationCity.user_id, {
          convoyId: convoy.id,
          destinationCityName: destinationCity.name,
          cargo: {
            gold: convoy.cargo_gold,
            metal: convoy.cargo_metal,
            fuel: convoy.cargo_fuel
          }
        });

        return { success: true };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Envoyer les convois automatiques (appelé par le worker)
   */
  async processAutoTransfers() {
    return runWithContext(async () => {
      const routes = await this.tradeRepository.getRoutesReadyForAutoTransfer();

      const results = [];

      for (const route of routes) {
        try {
          // Vérifier si les ressources sont suffisantes
          const originResources = await this.Resource.findOne({
            where: { city_id: route.origin_city_id }
          });

          const cargo = {
            gold: route.auto_transfer_gold,
            metal: route.auto_transfer_metal,
            fuel: route.auto_transfer_fuel
          };

          if (originResources.gold >= cargo.gold &&
              originResources.metal >= cargo.metal &&
              originResources.fuel >= cargo.fuel) {
            
            // Envoyer le convoi
            await this.sendConvoy(route.owner_user_id, {
              routeId: route.id,
              cargo,
              escortUnits: null
            });

            results.push({ routeId: route.id, success: true });
          } else {
            results.push({ routeId: route.id, success: false, reason: 'Ressources insuffisantes' });
          }
        } catch (error) {
          results.push({ routeId: route.id, success: false, reason: error.message });
        }
      }

      return results;
    });
  }

  /**
   * Récupérer les routes d'un utilisateur
   */
  async getUserTradeRoutes(userId, filters) {
    return this.tradeRepository.getUserTradeRoutes(userId, filters);
  }

  /**
   * Mettre à jour une route
   */
  async updateTradeRoute(userId, routeId, updateData) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        const route = await this.tradeRepository.getTradeRouteById(routeId);

        if (!route || route.owner_user_id !== userId) {
          throw new Error('Route introuvable ou non autorisée');
        }

        await this.tradeRepository.updateTradeRoute(routeId, updateData, transaction);
        await transaction.commit();

        return { success: true };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Supprimer une route
   */
  async deleteTradeRoute(userId, routeId) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        const route = await this.tradeRepository.getTradeRouteById(routeId);

        if (!route || route.owner_user_id !== userId) {
          throw new Error('Route introuvable ou non autorisée');
        }

        await this.tradeRepository.deleteTradeRoute(routeId, transaction);
        await transaction.commit();

        return { success: true };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Récupérer les convois d'une route
   */
  async getRouteConvoys(userId, routeId, filters) {
    const route = await this.tradeRepository.getTradeRouteById(routeId);

    if (!route || route.owner_user_id !== userId) {
      throw new Error('Route introuvable ou non autorisée');
    }

    return this.tradeRepository.getRouteConvoys(routeId, filters);
  }
}

module.exports = TradeService;
