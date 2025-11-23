require('dotenv').config();
const resourceService = require('./services/resourceService');

const updateResourcesForUser = async (userId) => {
    try {
    await resourceService.getUserResources(userId);
    console.log(`Resources updated successfully for user: ${userId}`);
  } catch (err) {
    console.error('Error updating resources:', err);
  }
};

module.exports = updateResourcesForUser;
