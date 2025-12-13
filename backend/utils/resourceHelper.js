/**
 * Helper pour gérer les ressources au format legacy (une ligne par type)
 */

/**
 * Convertir les ressources au format legacy vers un format exploitable
 * @param {Array} resources - Array de Resource avec {type, amount}
 * @returns {Object} - {or: number, metal: number, carburant: number, energie: number}
 */
function formatLegacyResources(resources) {
  const formatted = {
    or: 0,
    metal: 0,
    carburant: 0,
    energie: 0
  };

  if (!resources || !Array.isArray(resources)) {
    return formatted;
  }

  resources.forEach(res => {
    if (res.type && typeof res.amount === 'number') {
      formatted[res.type] = res.amount;
    }
  });

  return formatted;
}

/**
 * Récupérer toutes les ressources d'une ville au format exploitable
 * @param {Object} Resource - Modèle Sequelize Resource
 * @param {number} cityId - ID de la ville
 * @param {Object} transaction - Transaction Sequelize optionnelle
 * @returns {Object} - {or: number, metal: number, carburant: number, energie: number}
 */
async function getCityResources(Resource, cityId, transaction = null) {
  const resources = await Resource.findAll({
    where: { city_id: cityId },
    ...(transaction ? { transaction } : {})
  });

  return formatLegacyResources(resources);
}

/**
 * Mettre à jour les ressources d'une ville au format legacy
 * @param {Object} Resource - Modèle Sequelize Resource
 * @param {number} cityId - ID de la ville
 * @param {Object} updates - {or?, metal?, carburant?, energie?} - deltas ou valeurs absolues
 * @param {boolean} isAbsolute - Si true, set les valeurs; si false, ajoute les deltas
 * @param {Object} transaction - Transaction Sequelize
 */
async function updateCityResources(Resource, cityId, updates, isAbsolute = false, transaction = null) {
  const typeMap = {
    or: 'or',
    gold: 'or',
    metal: 'metal',
    carburant: 'carburant',
    fuel: 'carburant',
    energie: 'energie',
    energy: 'energie'
  };

  for (const [key, value] of Object.entries(updates)) {
    const type = typeMap[key];
    if (!type) {
      console.warn(`⚠️ Type de ressource inconnu: ${key}`);
      continue;
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`⚠️ Valeur invalide pour ${key}:`, value);
      continue;
    }

    const resource = await Resource.findOne({
      where: { city_id: cityId, type },
      ...(transaction ? { transaction } : {})
    });

    if (resource) {
      const newAmount = isAbsolute ? value : Math.max(0, resource.amount + value);
      resource.amount = newAmount;
      resource.last_update = new Date();
      resource.version += 1;
      await resource.save({ transaction });
      
      console.log(`💰 Ressource ${type} mise à jour pour ville ${cityId}: ${resource.amount} (delta: ${value})`);
    } else {
      console.warn(`⚠️ Ressource ${type} introuvable pour ville ${cityId}`);
    }
  }
}

module.exports = {
  formatLegacyResources,
  getCityResources,
  updateCityResources
};
