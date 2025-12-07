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
const ActionQueue = require('../models/ActionQueue');
const sequelize = require('../db');

// Buy a defense unit with delay queue
exports.buyDefenseUnit = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const city = await getUserMainCity(userId);
    if (!city) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Aucune ville trouvée pour ce joueur' });
    }

    const defId = req.params.id;
    const defense = await Defense.findOne({
      where: { id: defId, city_id: city.id },
      transaction,
    });
    if (!defense) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Defense not found' });
    }

    // Determine costs
    let costs = [];
    const entity = await Entity.findOne({
      where: { entity_type: 'defense', entity_name: defense.name },
      transaction,
    });

    if (entity) {
      const rc = await ResourceCost.findAll({
        where: { entity_id: entity.entity_id, level: 1 },
        transaction,
      });
      if (rc.length) {
        costs = rc.map((c) => ({
          resource_type: c.resource_type,
          amount: Number(c.amount),
        }));
      }
    }

    if (!costs.length) {
      if (!defense.cost || defense.cost <= 0) {
        defense.quantity += 1;
        await defense.save({ transaction });
        await transaction.commit();
        return res.json(defense);
      }
      costs = [
        {
          resource_type: 'metal',
          amount: Number(defense.cost),
        },
      ];
    }

    // Check city resources
    const cityResources = {};
    for (const cost of costs) {
      const type = cost.resource_type;
      if (!cityResources[type]) {
        cityResources[type] = await Resource.findOne({
          where: { city_id: city.id, type },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
      }
      const resRow = cityResources[type];
      const needed = Number(cost.amount);
      if (!resRow || resRow.amount < needed) {
        await transaction.rollback();
        return res.status(400).json({ message: `Pas assez de ${type}` });
      }
    }

    // Deduct resources
    for (const cost of costs) {
      const type = cost.resource_type;
      const needed = Number(cost.amount);
      const resRow = cityResources[type];
      resRow.amount -= needed;
      await resRow.save({ transaction });
    }

    // Count pending queued or in_progress defense actions
    const pendingCount = await ActionQueue.count({
      where: {
        cityId: city.id,
        entityId: defense.id,
        type: 'defense',
        status: ['queued', 'in_progress'],
      },
      transaction,
    });

    // Calculate duration (example: fixed 60 seconds per unit, can be adjusted)
    const durationSeconds = 60;

    // Find last queued action to set startTime
    const lastTask = await ActionQueue.findOne({
      where: { cityId: city.id, type: 'defense' },
      order: [['slot', 'DESC']],
      transaction,
    });

    const startTime = lastTask && lastTask.finishTime ? new Date(lastTask.finishTime) : new Date();
    const finishTime = new Date(startTime.getTime() + durationSeconds * 1000);

    // Create queue item
    const queueItem = await ActionQueue.create({
      cityId: city.id,
      entityId: defense.id,
      type: 'defense',
      status: lastTask ? 'queued' : 'in_progress',
      startTime,
      finishTime,
      slot: lastTask ? lastTask.slot + 1 : 1,
    }, { transaction });

    await transaction.commit();

    // Emit event to notify client (optional)
    // const io = require('../socket').getIO();
    // io.to(`user_${userId}`).emit('action_queue:update', { type: 'defense', queue: queueItem });

    res.json({ message: 'Defense unit purchase queued', queueItem });
  } catch (err) {
    await transaction.rollback();
    (req.logger || logger).error({ err }, 'Error queuing defense unit purchase');
    res.status(500).json({ message: 'Error queuing defense unit purchase' });
  }
};
