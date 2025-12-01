// backend/modules/cities/application/CityService.js
const { City, Resource } = require('../../../models');
const logger = require('../../../utils/logger');

class CityService {
  /**
   * Get specialization bonus multipliers
   * @param {string} specialization - Specialization type
   * @returns {object} Bonus multipliers for different aspects
   */
  getSpecializationBonuses(specialization) {
    const bonuses = {
      none: {
        gold: 1.0,
        metal: 1.0,
        fuel: 1.0,
        food: 1.0,
        unitProduction: 1.0,
        researchSpeed: 1.0,
        defensiveBonus: 1.0,
        description: 'Aucune spécialisation'
      },
      military: {
        gold: 0.9,
        metal: 1.1,
        fuel: 1.1,
        food: 1.0,
        unitProduction: 1.25, // +25% production d'unités
        researchSpeed: 0.95,
        defensiveBonus: 1.15, // +15% défense
        description: 'Production militaire accrue, bonus défensif'
      },
      economic: {
        gold: 1.3, // +30% or
        metal: 1.0,
        fuel: 1.0,
        food: 1.1,
        unitProduction: 0.9,
        researchSpeed: 1.0,
        defensiveBonus: 0.95,
        description: 'Production d\'or augmentée, commerce florissant'
      },
      industrial: {
        gold: 0.95,
        metal: 1.25, // +25% métal
        fuel: 1.25, // +25% carburant
        food: 1.0,
        unitProduction: 1.0,
        researchSpeed: 0.95,
        defensiveBonus: 1.0,
        description: 'Production de ressources industrielles accrue'
      },
      research: {
        gold: 1.0,
        metal: 1.0,
        fuel: 1.0,
        food: 1.1,
        unitProduction: 0.85,
        researchSpeed: 1.35, // +35% vitesse recherche
        defensiveBonus: 0.9,
        description: 'Vitesse de recherche grandement améliorée'
      }
    };

    return bonuses[specialization] || bonuses.none;
  }

  /**
   * Set city specialization
   * @param {number} cityId - City ID
   * @param {number} userId - User ID (for ownership verification)
   * @param {string} specialization - Specialization type
   * @returns {Promise<City>} Updated city
   */
  async setSpecialization(cityId, userId, specialization) {
    const validSpecializations = ['none', 'military', 'economic', 'industrial', 'research'];
    
    if (!validSpecializations.includes(specialization)) {
      throw new Error(`Invalid specialization. Must be one of: ${validSpecializations.join(', ')}`);
    }

    const city = await City.findOne({
      where: { id: cityId, user_id: userId }
    });

    if (!city) {
      throw new Error('City not found or you do not own this city');
    }

    // Check if already specialized (optional: prevent re-specialization without cost)
    if (city.specialization !== 'none' && specialization !== 'none') {
      logger.info(`City ${cityId} changing specialization from ${city.specialization} to ${specialization}`);
      // TODO: Implement cost/cooldown for changing specialization
    }

    city.specialization = specialization;
    city.specialized_at = specialization !== 'none' ? new Date() : null;
    await city.save();

    logger.info(`City ${cityId} specialized as ${specialization}`);
    return city;
  }

  /**
   * Get city with specialization details
   * @param {number} cityId - City ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} City with bonuses
   */
  async getCityWithSpecialization(cityId, userId) {
    const city = await City.findOne({
      where: { id: cityId, user_id: userId }
    });

    if (!city) {
      throw new Error('City not found');
    }

    const bonuses = this.getSpecializationBonuses(city.specialization);

    return {
      ...city.toJSON(),
      bonuses
    };
  }

  /**
   * Get all cities for a user with their specializations
   * @param {number} userId - User ID
   * @returns {Promise<array>} Cities with bonuses
   */
  async getUserCitiesWithSpecializations(userId) {
    const cities = await City.findAll({
      where: { user_id: userId },
      order: [['is_capital', 'DESC'], ['id', 'ASC']]
    });

    return cities.map(city => {
      const cityData = city.toJSON();
      return {
        ...cityData,
        coords: {
          x: cityData.coord_x,
          y: cityData.coord_y
        },
        bonuses: this.getSpecializationBonuses(city.specialization)
      };
    });
  }

  /**
   * Apply specialization bonus to resource production
   * Used by resource update job
   * @param {number} baseProduction - Base production value
   * @param {string} resourceType - Resource type (gold, metal, fuel, food)
   * @param {string} specialization - City specialization
   * @returns {number} Modified production
   */
  applyProductionBonus(baseProduction, resourceType, specialization) {
    const bonuses = this.getSpecializationBonuses(specialization);
    const multiplier = bonuses[resourceType] || 1.0;
    return Math.floor(baseProduction * multiplier);
  }

  /**
   * Apply specialization bonus to unit production time
   * @param {number} baseTime - Base production time in seconds
   * @param {string} specialization - City specialization
   * @returns {number} Modified production time
   */
  applyUnitProductionBonus(baseTime, specialization) {
    const bonuses = this.getSpecializationBonuses(specialization);
    // Higher multiplier = faster production (less time)
    return Math.floor(baseTime / bonuses.unitProduction);
  }

  /**
   * Apply specialization bonus to research speed
   * @param {number} baseTime - Base research time in seconds
   * @param {string} specialization - City specialization
   * @returns {number} Modified research time
   */
  applyResearchBonus(baseTime, specialization) {
    const bonuses = this.getSpecializationBonuses(specialization);
    return Math.floor(baseTime / bonuses.researchSpeed);
  }

  /**
   * Get defensive bonus for city
   * @param {number} cityId - City ID
   * @returns {Promise<number>} Defensive multiplier
   */
  async getDefensiveBonus(cityId) {
    const city = await City.findByPk(cityId);
    if (!city) return 1.0;
    
    const bonuses = this.getSpecializationBonuses(city.specialization);
    return bonuses.defensiveBonus;
  }
}

module.exports = CityService;
