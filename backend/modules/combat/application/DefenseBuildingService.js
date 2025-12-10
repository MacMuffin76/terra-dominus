/**
 * DefenseBuildingService - Construction de défenses
 * 
 * Permet aux joueurs de construire des défenses pour protéger leur ville
 * - Vérification des prérequis
 * - Déduction des ressources (via ResourceService)
 * - Création/mise à jour des défenses
 */
class DefenseBuildingService {
  constructor({ User, Defense, City, Resource, Facility, sequelize, resourceService }) {
    this.User = User;
    this.Defense = Defense;
    this.City = City;
    this.Resource = Resource; // conservé pour compat éventuelle
    this.Facility = Facility;
    this.sequelize = sequelize;
    this.resourceService = resourceService;
  }

  /**
   * Construire des défenses
   * @param {number} userId - ID de l'utilisateur
   * @param {string} defenseId - ID de la défense (ex: 'reinforced_wall')
   * @param {number} quantity - Quantité à construire
   * @param {Object} defenseDefinition - Définition de la défense
   * @returns {Promise<Object>} - Résultat de la construction
   */
  async buildDefense(userId, defenseId, quantity, defenseDefinition) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validation des paramètres
      if (!userId || !defenseId || !quantity || quantity < 1) {
        throw new Error('Paramètres invalides pour la construction');
      }

      if (!defenseDefinition) {
        throw new Error('Définition de défense introuvable');
      }

      // Vérifier que l'utilisateur existe (optionnel mais plus propre)
      const user = await this.User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Récupérer la ville principale du joueur
      const city = await this.City.findOne({
        where: { user_id: userId, is_capital: true },
        transaction,
      });

      if (!city) {
        throw new Error('City not found');
      }

      // Calculer le coût total (schéma logique : gold/metal/fuel/energy)
      const totalCost = {
        gold: (defenseDefinition.cost?.gold || 0) * quantity,
        metal: (defenseDefinition.cost?.metal || 0) * quantity,
        fuel: (defenseDefinition.cost?.fuel || 0) * quantity,
        energy: 0,
      };

      // Déduire les ressources via le ResourceService (gère city_id + table resources)
      await this.resourceService.deductResourcesFromUser(userId, totalCost, transaction);

      // Ajouter/créer la défense dans la BDD
      let defense = await this.Defense.findOne({
        where: {
          city_id: city.id,
          name: defenseDefinition.name,
        },
        transaction,
      });

      if (defense) {
        // Défense existe déjà, augmenter la quantité
        await defense.update(
          {
            quantity: defense.quantity + quantity,
            date_modification: new Date(),
          },
          { transaction },
        );
      } else {
        // Créer nouvelle entrée de défense
        defense = await this.Defense.create(
          {
            city_id: city.id,
            name: defenseDefinition.name,
            description: defenseDefinition.description,
            quantity,
            cost: (totalCost.gold || 0) + (totalCost.metal || 0) + (totalCost.fuel || 0),
            date_creation: new Date(),
            date_modification: new Date(),
          },
          { transaction },
        );
      }

      await transaction.commit();

      // Recharger les ressources restantes via le ResourceService
      const remainingResources = await this.resourceService.getUserResourceAmounts(userId);

      return {
        success: true,
        message: `${quantity} ${defenseDefinition.name} construit${quantity > 1 ? 'es' : 'e'} avec succès`,
        defense: {
          id: defense.id,
          name: defense.name,
          quantity: defense.quantity,
        },
        costPaid: totalCost,
        remainingResources,
      };
    } catch (error) {
      await transaction.rollback();
      console.error('[DefenseBuildingService] Error building defense:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les défenses d'un joueur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des défenses
   */
  async getPlayerDefenses(userId) {
    try {
      // Vérifier que l'utilisateur existe
      const user = await this.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Récupérer la ville principale
      const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
      if (!city) {
        throw new Error('City not found');
      }

      const defenses = await this.Defense.findAll({
        where: { city_id: city.id },
        order: [['name', 'ASC']],
      });

      return defenses;
    } catch (error) {
      console.error('[DefenseBuildingService] Error fetching player defenses:', error);
      throw error;
    }
  }
}

module.exports = DefenseBuildingService;
