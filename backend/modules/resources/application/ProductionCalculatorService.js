const { calculateStorageCapacities } = require('../domain/resourceRules');

/**
 * Service de calcul de production de ressources AAA
 * Prend en compte :
 * - Niveaux des bâtiments de production (via table resource_production)
 * - Bonus des recherches
 * - Bonus des installations
 * - Capacité de stockage
 */
class ProductionCalculatorService {
  constructor({ Building, Research, Facility, City, ResourceProduction }) {
    this.Building = Building;
    this.Research = Research;
    this.Facility = Facility;
    this.City = City;
    this.ResourceProduction = ResourceProduction;
  }

  /**
   * Calculer la production par seconde pour toutes les ressources
   * @param {number} userId 
   * @returns {Promise<Object>} { gold, metal, fuel, energy, storage: { gold, metal, fuel, energy } }
   */
  async calculateProductionRates(userId) {
    const city = await this.City.findOne({ where: { user_id: userId, is_capital: true } });
    if (!city) {
      throw new Error('City not found');
    }

    // Récupérer tous les bâtiments de production
    const buildings = await this.Building.findAll({ 
      where: { city_id: city.id } 
    });

    // Récupérer les recherches complétées
    const researches = await this.Research.findAll({
      where: { user_id: userId }
    });

    // Récupérer les installations (facilities)
    const facilities = await this.Facility.findAll({
      where: { city_id: city.id }
    });

    // Calculer les bonus totaux
    const bonuses = this._calculateTotalBonuses(researches, facilities);

    // Récupérer les taux de production depuis la table resource_production
    const baseProduction = await this._getProductionFromTable(buildings);

    // Appliquer les bonus
    const production = {
      gold: baseProduction.gold * (1 + bonuses.goldProduction),
      metal: baseProduction.metal * (1 + bonuses.metalProduction),
      fuel: baseProduction.fuel * (1 + bonuses.fuelProduction),
      energy: baseProduction.energy * (1 + bonuses.energyProduction),
    };

    // Calculer les capacités de stockage
    const hangar = buildings.find(b => b.name === "Hangar");
    const reservoir = buildings.find(b => b.name === "Réservoir");
    const centrale = buildings.find(b => b.name === "Centrale électrique");
    
    const storageRaw = calculateStorageCapacities({
      hangarLevel: hangar?.level || 0,
      reservoirLevel: reservoir?.level || 0,
      centraleLevel: centrale?.level || 0
    });
    
    // Convertir les noms de clés pour correspondre à l'API (or -> gold, carburant -> fuel, energie -> energy)
    const storage = {
      gold: storageRaw.or,
      metal: storageRaw.metal,
      fuel: storageRaw.carburant,
      energy: storageRaw.energie,
    };

    return {
      production,
      storage,
      bonuses,
    };
  }



  /**
   * Calculer tous les bonus de production et de stockage
   */
  _calculateTotalBonuses(researches, facilities) {
    const bonuses = {
      goldProduction: 0,
      metalProduction: 0,
      fuelProduction: 0,
      energyProduction: 0,
      storageCapacity: 0,
    };

    // Bonus des recherches
    researches.forEach(research => {
      if (research.level > 0) {
        // Exemples de bonus (à adapter selon vos recherches)
        if (research.name.includes('Extraction')) {
          bonuses.goldProduction += 0.10 * research.level;
          bonuses.metalProduction += 0.10 * research.level;
          bonuses.fuelProduction += 0.10 * research.level;
        }
        if (research.name.includes('Efficacité Énergétique')) {
          bonuses.energyProduction += 0.15 * research.level;
        }
        if (research.name.includes('Logistique')) {
          bonuses.storageCapacity += 0.20 * research.level;
        }
      }
    });

    // Bonus des installations (facilities)
    facilities.forEach(facility => {
      if (facility.level > 0) {
        // Centre de Ressources : +5% production par niveau
        if (facility.name.includes('Centre de Ressources') || facility.name.includes('Resource Center')) {
          const bonus = 0.05 * facility.level;
          bonuses.goldProduction += bonus;
          bonuses.metalProduction += bonus;
          bonuses.fuelProduction += bonus;
        }
        
        // Entrepôt Central : +10% stockage par niveau
        if (facility.name.includes('Entrepôt') || facility.name.includes('Warehouse')) {
          bonuses.storageCapacity += 0.10 * facility.level;
        }
      }
    });

    return bonuses;
  }

  /**
   * Récupérer les taux de production depuis la table resource_production
   */
  async _getProductionFromTable(buildings) {
    const production = {
      gold: 0,
      metal: 0,
      fuel: 0,
      energy: 0,
    };

    const buildingMapping = {
      "Mine d'or": 'gold',
      "Mine de métal": 'metal',
      "Extracteur": 'fuel',
      "Centrale électrique": 'energy',
    };

    for (const building of buildings) {
      const resourceType = buildingMapping[building.name];
      if (!resourceType || building.level === 0) continue;

      // Récupérer le taux de production pré-calculé par nom de bâtiment et niveau
      const productionData = await this.ResourceProduction.findOne({
        where: {
          building_name: building.name,
          level: building.level
        }
      });

      if (productionData) {
        // production_rate est par heure, convertir en par seconde
        production[resourceType] = parseFloat(productionData.production_rate) / 3600;
      }
    }

    return production;
  }

  /**
   * Calculer les ressources gagnées pendant une période d'absence
   * @param {Object} currentResources - Ressources actuelles
   * @param {Object} production - Production par seconde
   * @param {Object} storage - Capacités de stockage
   * @param {number} elapsedSeconds - Temps écoulé en secondes
   * @returns {Object} Nouvelles ressources (plafonnées par le stockage)
   */
  calculateOfflineProduction(currentResources, production, storage, elapsedSeconds) {
    const newResources = {};

    ['gold', 'metal', 'fuel', 'energy'].forEach(resource => {
      const produced = production[resource] * elapsedSeconds;
      const newAmount = Math.min(
        currentResources[resource] + produced,
        storage[resource]
      );
      newResources[resource] = Math.floor(newAmount);
    });

    return newResources;
  }
}

module.exports = ProductionCalculatorService;
