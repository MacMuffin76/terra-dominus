/**
 * DefenseBuildingService - Construction de défenses
 * 
 * Permet aux joueurs de construire des défenses pour protéger leur ville
 * - Vérification des prérequis
 * - Déduction des ressources
 * - Création/mise à jour des défenses
 */
class DefenseBuildingService {
  constructor({ User, Defense, City, Resource, Facility, sequelize }) {
    this.User = User;
    this.Defense = Defense;
    this.City = City;
    this.Resource = Resource;
    this.Facility = Facility;
    this.sequelize = sequelize;
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

      // Récupérer la ville principale du joueur
      const user = await this.User.findByPk(userId, {
        include: [{
          model: this.City,
          as: 'city',
          required: true
        }],
        transaction
      });

      if (!user || !user.city) {
        throw new Error('Ville introuvable');
      }

      const city = user.city;

      // Récupérer les ressources du joueur
      const resources = await this.Resource.findOne({
        where: { user_id: userId },
        transaction
      });

      if (!resources) {
        throw new Error('Ressources introuvables');
      }

      // Calculer le coût total
      const totalCost = {
        gold: (defenseDefinition.cost?.gold || 0) * quantity,
        metal: (defenseDefinition.cost?.metal || 0) * quantity,
        fuel: (defenseDefinition.cost?.fuel || 0) * quantity
      };

      // Vérifier les ressources disponibles
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

      // Ajouter/créer la défense dans la BDD
      let defense = await this.Defense.findOne({
        where: { 
          city_id: city.id,
          name: defenseDefinition.name
        },
        transaction
      });

      if (defense) {
        // Défense existe déjà, augmenter la quantité
        await defense.update({
          quantity: defense.quantity + quantity,
          date_modification: new Date()
        }, { transaction });
      } else {
        // Créer nouvelle entrée de défense
        defense = await this.Defense.create({
          city_id: city.id,
          name: defenseDefinition.name,
          description: defenseDefinition.description,
          quantity: quantity,
          cost: totalCost.gold + totalCost.metal + totalCost.fuel, // Coût total enregistré
          date_creation: new Date(),
          date_modification: new Date()
        }, { transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: `${quantity} ${defenseDefinition.name} construit${quantity > 1 ? 'es' : 'e'} avec succès`,
        defense: {
          id: defense.id,
          name: defense.name,
          quantity: defense.quantity
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
      const user = await this.User.findByPk(userId, {
        include: [{
          model: this.City,
          as: 'city',
          required: true
        }]
      });

      if (!user || !user.city) {
        throw new Error('Ville introuvable');
      }

      const defenses = await this.Defense.findAll({
        where: { city_id: user.city.id },
        order: [['name', 'ASC']]
      });

      return defenses;

    } catch (error) {
      console.error('[DefenseBuildingService] Error fetching player defenses:', error);
      throw error;
    }
  }
}

module.exports = DefenseBuildingService;
