const { runWithContext } = require('../../../utils/logger');

/**
 * UnitTrainingService - Gestion de l'entraînement des unités
 * 
 * Fonctionnalités:
 * - Entraîner des unités (ajouter quantité)
 * - Vérifier ressources disponibles
 * - Calculer coût total
 */
class UnitTrainingService {
  constructor({ User, Unit, City, Resource, Facility, sequelize, resourceService }) {
    this.User = User;
    this.Unit = Unit;
    this.City = City;
    this.Resource = Resource;
    this.Facility = Facility;
    this.sequelize = sequelize;
    this.resourceService = resourceService;
  }

  /**
   * Entraîner des unités
   * @param {number} userId - ID du joueur
   * @param {string} unitId - ID de l'unité (ex: 'militia', 'riflemen')
   * @param {number} quantity - Nombre d'unités à entraîner
   * @param {Object} unitDefinition - Définition de l'unité (coût, stats)
   * @returns {Promise<Object>}
   */
  async trainUnits(userId, unitId, quantity, unitDefinition) {
    return runWithContext(async () => {
      const transaction = await this.sequelize.transaction();

      try {
        // Validation
        if (!unitDefinition) {
          throw new Error(`Unit ${unitId} not found`);
        }

        if (quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }

        // Récupérer user et city
        const user = await this.User.findByPk(userId, { transaction });
        if (!user) {
          throw new Error('User not found');
        }

        const city = await this.City.findOne({ 
          where: { user_id: userId, is_capital: true },
          transaction
        });
        if (!city) {
          throw new Error('City not found');
        }

        // Calculer coût total
        const totalCost = {
          gold: (unitDefinition.cost.gold || 0) * quantity,
          metal: (unitDefinition.cost.metal || 0) * quantity,
          fuel: (unitDefinition.cost.fuel || 0) * quantity,
          energy: 0
        };

        // Déduire les ressources via le ResourceService (gestion par ville + table resources)
        await this.resourceService.deductResourcesFromUser(userId, totalCost, transaction);

        // Ajouter/créer l'unité dans la BDD
        let unit = await this.Unit.findOne({
          where: { 
            city_id: city.id,
            name: unitDefinition.name
          },
          transaction
        });

        if (unit) {
          // Unité existe déjà, augmenter la quantité
          await unit.update({
            quantity: unit.quantity + quantity
          }, { transaction });
        } else {
          // Créer nouvelle entrée d'unité
          unit = await this.Unit.create({
            city_id: city.id,
            name: unitDefinition.name,
            quantity: quantity,
            force: unitDefinition.attack || 0,
            capacite_speciale: unitDefinition.category || null
          }, { transaction });
        }

        await transaction.commit();

        // Recharger les ressources restantes via le ResourceService
        const remainingResources = await this.resourceService.getUserResourceAmounts(userId);

        return {
          success: true,
          message: `${quantity} ${unitDefinition.name} entraîné${quantity > 1 ? 's' : ''} avec succès`,
          unit: {
            id: unit.id,
            name: unit.name,
            quantity: unit.quantity
          },
          costPaid: totalCost,
          remainingResources
        };

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  }

  /**
   * Obtenir les unités du joueur
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async getPlayerUnits(userId) {
    return runWithContext(async () => {
      const city = await this.City.findOne({ 
        where: { user_id: userId, is_capital: true }
      });
      if (!city) {
        throw new Error('City not found');
      }

      const units = await this.Unit.findAll({
        where: { city_id: city.id },
        order: [['name', 'ASC']]
      });

      return units;
    });
  }
}

module.exports = UnitTrainingService;
