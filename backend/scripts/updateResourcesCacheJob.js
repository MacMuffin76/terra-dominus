const ResourceService = require('../services/resourceService');

async function updateAllUsersResourcesCache() {
  // TODO: récupérer tous les userIds (à adapter selon ta base utilisateur)
  const allUserIds = await getAllUserIds(); // À implémenter

  const resourceService = require('../services/resourceService');

  for (const userId of allUserIds) {
    try {
      await resourceService.updateUserResourcesCache(userId);
      console.log(`Cache mis à jour pour user ${userId}`);
    } catch (err) {
      console.error(`Erreur mise à jour cache user ${userId}:`, err);
    }
  }
}

async function getAllUserIds() {
  // Exemple brut, à remplacer par ta vraie logique
  const User = require('../../models/User');
  const users = await User.findAll({ attributes: ['id'] });
  return users.map(u => u.id);
}

module.exports = { updateAllUsersResourcesCache };

// Cette fonction peut être lancée périodiquement par un cron ou un worker
// Ex: node backend/scripts/updateResourcesCacheJob.js

if (require.main === module) {
  updateAllUsersResourcesCache().then(() => {
    console.log('Mise à jour cache complète terminée.');
    process.exit(0);
  }).catch((err) => {
    console.error('Erreur lors de la mise à jour complète du cache:', err);
    process.exit(1);
  });
}
