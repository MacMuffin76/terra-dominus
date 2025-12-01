// backend/modules/cities/api/cityController.js
const { getLogger } = require('../../../utils/logger');
const logger = getLogger('CityController');

function createCityController({ cityService }) {
  /**
   * Get all cities for current user
   */
  async function getUserCities(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const cities = await cityService.getUserCitiesWithSpecializations(req.user.id);
      res.json(cities);
    } catch (error) {
      logger.error({ err: error }, 'Error getting user cities');
      res.status(500).json({ message: 'Failed to retrieve cities' });
    }
  }

  /**
   * Get specific city details
   */
  async function getCityDetails(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { cityId } = req.params;
      const city = await cityService.getCityWithSpecialization(
        parseInt(cityId),
        req.user.id
      );
      res.json(city);
    } catch (error) {
      logger.error({ err: error }, 'Error getting city details');
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to retrieve city details' });
    }
  }

  /**
   * Set city specialization
   */
  async function setSpecialization(req, res) {
    try {
      const { cityId } = req.params;
      const { specialization } = req.body;

      if (!specialization) {
        return res.status(400).json({ message: 'Specialization is required' });
      }

      const city = await cityService.setSpecialization(
        parseInt(cityId),
        req.user.id,
        specialization
      );

      res.json({
        message: `City specialized as ${specialization}`,
        city: {
          ...city.toJSON(),
          bonuses: cityService.getSpecializationBonuses(specialization)
        }
      });
    } catch (error) {
      logger.error('Error setting city specialization:', error);
      if (error.message.includes('Invalid specialization')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to set specialization' });
    }
  }

  /**
   * Get available specializations with descriptions
   */
  async function getSpecializationTypes(req, res) {
    try {
      const types = {
        none: cityService.getSpecializationBonuses('none'),
        military: cityService.getSpecializationBonuses('military'),
        economic: cityService.getSpecializationBonuses('economic'),
        industrial: cityService.getSpecializationBonuses('industrial'),
        research: cityService.getSpecializationBonuses('research')
      };

      res.json(types);
    } catch (error) {
      logger.error('Error getting specialization types:', error);
      res.status(500).json({ message: 'Failed to retrieve specialization types' });
    }
  }

  return {
    getUserCities,
    getCityDetails,
    setSpecialization,
    getSpecializationTypes
  };
}

module.exports = createCityController;
