// backend/testUpdateResources.js
const updateResourcesForUser = require('./updateResources');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'testUpdateResources' });

const userId = 2; // Remplacez par l'ID utilisateur que vous souhaitez tester

updateResourcesForUser(userId)
  .then(() => {
    logger.info('Test completed successfully');
  })
  .catch((err) => {
    logger.error({ err }, 'Test failed');
  });