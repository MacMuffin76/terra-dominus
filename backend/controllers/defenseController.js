// backend/controllers/defenseController.js

const Defense      = require('../models/Defense');
const Resource     = require('../models/Resource');
const Entity       = require('../models/Entity');
const ResourceCost = require('../models/ResourceCost');
const City         = require('../models/City');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'DefenseController' });

/**
 * Récupère la ville "principale" de l'utilisateur (capitale)
 */
const getUserMainCity = async (userId) => {
  // on prend la capitale si elle existe, sinon la première ville
  let city = await City.findOne({
    where: { user_id: userId, is_capital: true },
  });

  if (!city) {
    city = await City.findOne({ where: { user_id: userId } });
  }

  return city;
};

/**
 * GET /api/defense/defenses
 * Liste toutes les défenses de la ville principale du joueur
 */
exports.getDefenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée pour ce joueur' });
    }

    const defenses = await Defense.findAll({
      where: { city_id: city.id },
      order: [['id', 'ASC']],
    });

    res.json(defenses);
  } catch (err) {
    (req.logger || logger).error({ err }, 'Error fetching defenses');
    res.status(500).json({ message: 'Error fetching defense buildings' });
  }
};

/**
 * GET /api/defense/defense-buildings/:id
 * Détails d’une défense pour la ville principale du joueur
 */
exports.getDefenseDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée pour ce joueur' });
    }

    const defId   = req.params.id;
    const defense = await Defense.findOne({
      where: { id: defId, city_id: city.id },
    });

    if (!defense) {
      return res.status(404).json({ message: 'Defense not found' });
    }

    // Coût depuis resource_costs (level 1) si défini
    let costs = [];
    const entity = await Entity.findOne({
      where: { entity_type: 'defense', entity_name: defense.name },
    });

    if (entity) {
      const rc = await ResourceCost.findAll({
        where: { entity_id: entity.entity_id, level: 1 },
      });

      costs = rc.map((c) => ({
        resource_type: c.resource_type,
        amount: Number(c.amount),
      }));
    }

    // Fallback : si pas de resource_costs, on utilise la colonne "cost" en métal
    if (!costs.length && defense.cost > 0) {
      costs = [
        {
          resource_type: 'metal',
          amount: Number(defense.cost),
        },
      ];
    }

    return res.json({
      id:          defense.id,
      name:        defense.name,
      description: defense.description,
      quantity:    defense.quantity,
      cost:        defense.cost,
      costs,
    });
  } catch (err) {
    (req.logger || logger).error({ err }, 'Error fetching defense details');
    res.status(500).json({ message: 'Error fetching defense details' });
  }
};

/**
 * POST /api/defense/defense-buildings/:id/upgrade
 * Achat d’UNE unité de défense pour la ville principale (quantity += 1)
 */
exports.buyDefenseUnit = async (req, res) => {
  try {
    const userId = req.user.id;
    const city   = await getUserMainCity(userId);

    if (!city) {
      return res.status(404).json({ message: 'Aucune ville trouvée pour ce joueur' });
    }

    const defId   = req.params.id;
    const defense = await Defense.findOne({
      where: { id: defId, city_id: city.id },
    });

    if (!defense) {
      return res.status(404).json({ message: 'Defense not found' });
    }

    // 1️⃣ Déterminer les coûts
    let costs = [];
    const entity = await Entity.findOne({
      where: { entity_type: 'defense', entity_name: defense.name },
    });

    if (entity) {
      const rc = await ResourceCost.findAll({
        where: { entity_id: entity.entity_id, level: 1 },
      });

      if (rc.length) {
        costs = rc.map((c) => ({
          resource_type: c.resource_type,
          amount: Number(c.amount),
        }));
      }
    }

    // Fallback : si rien dans resource_costs, utiliser defense.cost en métal
    if (!costs.length) {
      if (!defense.cost || defense.cost <= 0) {
        // Aucun coût → on crédite directement la défense
        defense.quantity += 1;
        await defense.save();
        return res.json(defense);
      }

      costs = [
        {
          resource_type: 'metal',
          amount: Number(defense.cost),
        },
      ];
    }

    // 2️⃣ Vérifier les ressources de la ville
    const cityResources = {};
    for (const cost of costs) {
      const type = cost.resource_type;

      if (!cityResources[type]) {
        cityResources[type] = await Resource.findOne({
          where: { city_id: city.id, type },
        });
      }

      const resRow = cityResources[type];
      const needed = Number(cost.amount);

      if (!resRow || resRow.amount < needed) {
        return res
          .status(400)
          .json({ message: `Pas assez de ${type}` });
      }
    }

    // 3️⃣ Déduire les ressources
    for (const cost of costs) {
      const type   = cost.resource_type;
      const needed = Number(cost.amount);

      const resRow = cityResources[type];
      resRow.amount -= needed;
      await resRow.save();
    }

    // 4️⃣ Ajouter l’unité de défense
    defense.quantity += 1;
    await defense.save();

    (req.logger || logger).audit({ userId, defenseId: defense.id, cityId: city.id }, 'Defense unit purchased');
    return res.json({
      id:          defense.id,
      name:        defense.name,
      description: defense.description,
      quantity:    defense.quantity,
      cost:        defense.cost,
    });
  } catch (err) {
    (req.logger || logger).error({ err }, 'Error buying defense unit');
    res.status(500).json({ message: 'Error buying defense' });
  }
};