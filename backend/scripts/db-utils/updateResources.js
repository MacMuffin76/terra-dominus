require('dotenv').config();
const resourceService = require('./services/resourceService');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'updateResources' });

const updateResourcesForUser = async (userId) => {
  try {
    await resourceService.getUserResources(userId);
    logger.info({ userId }, 'Resources updated successfully');
  } catch (err) {
    logger.error({ err, userId }, 'Error updating resources');
  }
};

module.exports = updateResourcesForUser;