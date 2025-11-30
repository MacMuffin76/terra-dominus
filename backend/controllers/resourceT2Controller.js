const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ResourceT2Controller' });

/**
 * Create Resource T2 Controller
 * @param {object} dependencies - { resourceT2Service }
 * @returns {object} Controller methods
 */
function createResourceT2Controller({ resourceT2Service }) {
  /**
   * GET /api/v1/resources/t2
   * Get user's T2 resources
   */
  async function getUserResources(req, res) {
    try {
      const userId = req.user.id;

      const resources = await resourceT2Service.getUserResources(userId);

      res.json({
        success: true,
        resources,
      });
    } catch (error) {
      logger.error({ error, userId: req.user.id }, 'Failed to get T2 resources');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve T2 resources',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/resources/t2/recipes
   * Get all available conversion recipes
   */
  async function getRecipes(req, res) {
    try {
      const recipes = await resourceT2Service.getAvailableRecipes();

      res.json({
        success: true,
        recipes,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get recipes');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recipes',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/resources/t2/convert
   * Start a resource conversion
   * Body: { resourceType, quantity }
   */
  async function startConversion(req, res) {
    try {
      const userId = req.user.id;
      const { resourceType, quantity } = req.body;

      // Validation
      if (!resourceType) {
        return res.status(400).json({
          success: false,
          message: 'Resource type is required',
        });
      }

      if (!['titanium', 'plasma', 'nanotubes'].includes(resourceType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource type. Must be: titanium, plasma, or nanotubes',
        });
      }

      const conversionQuantity = quantity || 1;
      if (conversionQuantity < 1 || conversionQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be between 1 and 10',
        });
      }

      const conversion = await resourceT2Service.startConversion(
        userId,
        resourceType,
        conversionQuantity
      );

      res.status(201).json({
        success: true,
        conversion,
      });
    } catch (error) {
      logger.error({ error, userId: req.user.id, body: req.body }, 'Failed to start conversion');

      const status = error.message.includes('Maximum') ? 400 : 500;

      res.status(status).json({
        success: false,
        message: error.message || 'Failed to start conversion',
      });
    }
  }

  /**
   * GET /api/v1/resources/t2/conversions
   * Get user's conversions
   * Query: ?status=in_progress&limit=10&offset=0
   */
  async function getUserConversions(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit, offset } = req.query;

      const options = {};
      if (status) {
        options.status = status;
      }
      if (limit) {
        options.limit = parseInt(limit);
      }
      if (offset) {
        options.offset = parseInt(offset);
      }

      const conversions = await resourceT2Service.getUserConversions(userId, options);

      res.json({
        success: true,
        conversions,
      });
    } catch (error) {
      logger.error({ error, userId: req.user.id }, 'Failed to get conversions');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversions',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/v1/resources/t2/conversions/:id
   * Cancel a conversion
   */
  async function cancelConversion(req, res) {
    try {
      const userId = req.user.id;
      const conversionId = parseInt(req.params.id);

      if (!conversionId || isNaN(conversionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conversion ID',
        });
      }

      const result = await resourceT2Service.cancelConversion(userId, conversionId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error(
        { error, userId: req.user.id, conversionId: req.params.id },
        'Failed to cancel conversion'
      );

      const status = error.message.includes('Not authorized') ? 403 : 500;

      res.status(status).json({
        success: false,
        message: error.message || 'Failed to cancel conversion',
      });
    }
  }

  /**
   * POST /api/v1/resources/t2/conversions/:id/speedup
   * Complete a conversion instantly with premium currency
   */
  async function speedupConversion(req, res) {
    try {
      const userId = req.user.id;
      const conversionId = parseInt(req.params.id);

      if (!conversionId || isNaN(conversionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conversion ID',
        });
      }

      const result = await resourceT2Service.speedupConversion(userId, conversionId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error(
        { error, userId: req.user.id, conversionId: req.params.id },
        'Failed to speedup conversion'
      );

      const status = error.message.includes('Not authorized') ? 403 : 500;

      res.status(status).json({
        success: false,
        message: error.message || 'Failed to speedup conversion',
      });
    }
  }

  /**
   * POST /api/v1/resources/t2/collect
   * Collect passive production
   */
  async function collectPassiveProduction(req, res) {
    try {
      const userId = req.user.id;

      // TODO: Get user's buildings
      const userBuildings = []; // Placeholder

      const result = await resourceT2Service.awardPassiveProduction(userId, userBuildings);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user.id }, 'Failed to collect passive production');
      res.status(500).json({
        success: false,
        message: 'Failed to collect passive production',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/v1/resources/t2/storage
   * Update storage capacity (called when warehouse upgraded)
   * Body: { warehouseLevel }
   */
  async function updateStorageCapacity(req, res) {
    try {
      const userId = req.user.id;
      const { warehouseLevel } = req.body;

      if (warehouseLevel === undefined || warehouseLevel < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid warehouse level is required',
        });
      }

      const result = await resourceT2Service.updateStorageCapacity(userId, warehouseLevel);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error({ error, userId: req.user.id }, 'Failed to update storage capacity');
      res.status(500).json({
        success: false,
        message: 'Failed to update storage capacity',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/resources/t2/statistics
   * Get T2 statistics (user or global)
   */
  async function getStatistics(req, res) {
    try {
      const userId = req.query.global === 'true' ? null : req.user.id;

      const statistics = await resourceT2Service.getStatistics(userId);

      res.json({
        success: true,
        statistics,
      });
    } catch (error) {
      logger.error({ error, userId: req.user?.id }, 'Failed to get statistics');
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message,
      });
    }
  }

  return {
    getUserResources,
    getRecipes,
    startConversion,
    getUserConversions,
    cancelConversion,
    speedupConversion,
    collectPassiveProduction,
    updateStorageCapacity,
    getStatistics,
  };
}

module.exports = createResourceT2Controller;
