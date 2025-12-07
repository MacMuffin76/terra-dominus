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
  constructor({ User, Unit, City, Resource, Facility, sequelize }) {
    this.User = User;
    this.Unit = Unit;
    this.City = City;
    this.Resource = Resource;
    this.Facility = Facility;
    this.sequelize = sequelize;
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

        // Récupérer les ressources
        const resources = await this.Resource.findOne({
          where: { user_id: userId },
          transaction
        });
        if (!resources) {
          throw new Error('Resources not found');
        }

        // Calculer coût total
        const totalCost = {
          gold: (unitDefinition.cost.gold || 0) * quantity,
          metal: (unitDefinition.cost.metal || 0) * quantity,
          fuel: (unitDefinition.cost.fuel || 0) * quantity
        };

        // Vérifier ressources suffisantes
        if (resources.or < totalCost.gold) {
          throw new Error(`Or insuffisant (besoin: ${totalCost.gold}, disponible: ${resources.or})`);
        }
        if (resources.metal < totalCost.metal) {
          throw new Error(`Métal insuffisant (besoin: ${totalCost.metal}, disponible: ${resources.metal})`);
        }
        if (resources.carburant < totalCost.fuel) {
          throw new Error(`Carburant insuffisant (besoin: ${totalCost.fuel}, disponible: ${resources.carburant})`);
        }

        // Déduire les ressources
        await resources.update({
          or: resources.or - totalCost.gold,
          metal: resources.metal - totalCost.metal,
          carburant: resources.carburant - totalCost.fuel
        }, { transaction });

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

        return {
          success: true,
          message: `${quantity} ${unitDefinition.name} entraîné${quantity > 1 ? 's' : ''} avec succès`,
          unit: {
            id: unit.id,
            name: unit.name,
            quantity: unit.quantity
          },
          costPaid: totalCost,
          remainingResources: {
            gold: resources.or - totalCost.gold,
            metal: resources.metal - totalCost.metal,
            fuel: resources.carburant - totalCost.fuel
          }
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
