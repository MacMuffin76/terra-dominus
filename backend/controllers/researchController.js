const Research = require('../models/Research');
const BlueprintRepository = require('../repositories/BlueprintRepository');
const { getLogger } = require('../utils/logger');

const blueprintRepository = new BlueprintRepository();
const logger = getLogger({ module: 'ResearchController' });

const DEFAULT_RESEARCH_TYPES = [
        'Boucliers Énergétiques',
        'Fortifications',
        'Systèmes de Ciblage',
        'Extraction Avancée',
        'Efficacité Énergétique',
        'Logistique',
        'Cartographie',
        'Logistique rapide',
        'Armement Anti-Blindage',
        'Armes à Énergie',
        'Forces Spéciales',
        'Armes Automatiques',
        'Tactiques de Guérilla',
        'Formation Militaire',
        'Blindage Lourd',
        'Motorisation',
];

const computeCostBreakdown = (blueprint, level) => {
  if (!blueprint || (blueprint.max_level && level > blueprint.max_level)) {
    return [];
  }

  return Object.entries(blueprint.costs || {}).map(([resource, amount]) => ({
    resource_type: resource,
    amount: Number(amount || 0) * level,
  }));
};

const computeDuration = (blueprint, level) => {
  if (!blueprint || (blueprint.max_level && level > blueprint.max_level)) {
    return null;
  }

  return (blueprint.base_duration_seconds || 0) * level;
};

const sumCost = (costs) => costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

const ensureUserResearches = async (userId) => {
  const researches = await Research.findAll({ where: { user_id: userId } });
  const blueprints = await blueprintRepository.listByCategory('research');
  const expectedTypes = blueprints.length ? blueprints.map((bp) => bp.type) : DEFAULT_RESEARCH_TYPES;

  const missingTypes = expectedTypes.filter(
    (name) => !researches.some((research) => research.name === name)
  );

  if (missingTypes.length > 0) {
    await Research.bulkCreate(
      missingTypes.map((name) => {
        const blueprint = blueprints.find((bp) => bp.type === name);
        const costBreakdown = computeCostBreakdown(blueprint, 1);

        return {
          user_id: userId,
          name,
          level: 0,
          nextlevelcost: sumCost(costBreakdown),
          description: null,
        };
      })
    );

    return Research.findAll({ where: { user_id: userId } });
  }

  return researches;
};

// Get all research items
exports.getResearchItems = async (req, res) => {
  try {
    const researches = await ensureUserResearches(req.user.id);
    const blueprints = await blueprintRepository.listByCategory('research');

    const payload = researches.map((research) => {
      const blueprint = blueprints.find((bp) => bp.type === research.name);
      const nextLevel = Number(research.level || 0) + 1;
      const costBreakdown = computeCostBreakdown(blueprint, nextLevel);

      return {
        ...research.toJSON(),
        nextLevelCost: sumCost(costBreakdown),
        costBreakdown,
        nextLevelDuration: computeDuration(blueprint, nextLevel),
        maxLevel: blueprint?.max_level ?? null,
      };
  });

  res.json(payload);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching research items');
    res.status(500).json({ message: 'Error fetching research items' });
  }
};

// Get details of a specific research item
exports.getResearchDetails = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    const blueprint = await blueprintRepository.findByCategoryAndType('research', research.name);
    const nextLevel = Number(research.level || 0) + 1;
    const costBreakdown = computeCostBreakdown(blueprint, nextLevel);
    res.json({
      ...research.dataValues,
      description: research.description,
      nextLevelCost: sumCost(costBreakdown),
      costBreakdown,
      nextLevelDuration: computeDuration(blueprint, nextLevel),
      maxLevel: blueprint?.max_level ?? null,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching research details');
    res.status(500).json({ message: 'Error fetching research details' });
  }
};

const ActionQueue = require('../models/ActionQueue');
const sequelize = require('../db');

// Upgrade a specific research item with delay queue
exports.upgradeResearch = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const research = await Research.findByPk(req.params.id, { transaction });
    if (!research) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Research not found' });
    }
    const blueprint = await blueprintRepository.findByCategoryAndType('research', research.name);
    if (blueprint?.max_level && research.level >= blueprint.max_level) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Max level reached for this research' });
    }

    const city = await require('../utils/cityUtils').getUserMainCity(req.user.id);
    if (!city) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User city not found' });
    }

    // Count pending queued or in_progress actions for this city and entity
    const pendingCount = await ActionQueue.count({
      where: {
        cityId: city.id,
        entityId: research.id,
        type: 'research',
        status: ['queued', 'in_progress'],
      },
      transaction,
    });

    const nextLevel = (Number(research.level) || 0) + pendingCount + 1;
    const durationSeconds = blueprint ? (blueprint.base_duration_seconds || 0) * nextLevel : 0;

    // Find last queued action to set startTime
    const lastTask = await ActionQueue.findOne({
      where: { cityId: city.id, type: 'research' },
      order: [['slot', 'DESC']],
      transaction,
    });

    const startTime = lastTask && lastTask.finishTime ? new Date(lastTask.finishTime) : new Date();
    const finishTime = new Date(startTime.getTime() + durationSeconds * 1000);

    const queueItem = await ActionQueue.create({
      cityId: city.id,
      entityId: research.id,
      type: 'research',
      status: lastTask ? 'queued' : 'in_progress',
      startTime,
      finishTime,
      slot: lastTask ? lastTask.slot + 1 : 1,
    }, { transaction });

    await transaction.commit();

    // Emit event to notify client (optional, implement socket.io emit if needed)
    // const io = require('../socket').getIO();
    // io.to(`user_${req.user.id}`).emit('action_queue:update', { type: 'research', queue: queueItem });

    res.json({ message: 'Research upgrade queued', queueItem });
  } catch (error) {
    await transaction.rollback();
    (req.logger || logger).error({ err: error }, 'Error queuing research upgrade');
    // Return a more descriptive error message for frontend
    res.status(500).json({ message: 'Erreur lors du démarrage de la recherche, elle sera appliquée après délai.' });
  }
};

// Destroy a specific research item
exports.destroyResearch = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    await research.destroy();
    (req.logger || logger).audit({ userId: req.user.id, researchId: research.id }, 'Research destroyed');
    res.json({ message: 'Research destroyed' });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error destroying research');
    res.status(500).json({ message: 'Error destroying research' });
  }
};
