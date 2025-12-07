const Training = require('../models/Training');
const BlueprintRepository = require('../repositories/BlueprintRepository');
const { getLogger } = require('../utils/logger');

const blueprintRepository = new BlueprintRepository();
const logger = getLogger({ module: 'TrainingController' });

const computeCostBreakdown = (unitStat, level) => {
  if (!unitStat) {
    return [];
  }

  // Example: multiply base cost by level (assuming cost is stored in unitStat)
  return [
    { resource_type: 'gold', amount: (unitStat.base_cost_gold || 0) * level },
    { resource_type: 'metal', amount: (unitStat.base_cost_metal || 0) * level },
  ];
};

const computeDuration = (unitStat, level) => {
  if (!unitStat) {
    return null;
  }

  return (unitStat.base_training_time_seconds || 0) * level;
};

const sumCost = (costs) => costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

const ensureUserTrainings = async (userId) => {
  const trainings = await Training.findAll({
    where: { user_id: userId },
  });

  // Fetch all unit stats from the unit_stats table
  const unitStats = await require('../models/UnitStats').findAll();

  const expectedTypes = unitStats.map((unit) => unit.unit_key);

  const missingTypes = expectedTypes.filter(
    (unitKey) => !trainings.some((training) => training.name === unitKey)
  );

  if (missingTypes.length > 0) {
    await Training.bulkCreate(
      missingTypes.map((unitKey) => {
        const unitStat = unitStats.find((unit) => unit.unit_key === unitKey);
        const costBreakdown = computeCostBreakdown(unitStat, 1);

        return {
          user_id: userId,
          name: unitKey,
          level: 0,
          nextlevelcost: sumCost(costBreakdown),
          description: unitStat ? unitStat.description : null,
        };
      })
    );

    return Training.findAll({ where: { user_id: userId } });
  }

  return trainings;
};

// Get all training centers
exports.getTrainingCenters = async (req, res) => {
  try {
    const trainings = await ensureUserTrainings(req.user.id);
    const blueprints = await blueprintRepository.listByCategory('unit');

    const payload = trainings.map((training) => {
      const blueprint = blueprints.find((bp) => bp.type === training.name);
      const nextLevel = Number(training.level || 0) + 1;
      const costBreakdown = computeCostBreakdown(blueprint, nextLevel);

      return {
        ...training.toJSON(),
        nextLevelCost: sumCost(costBreakdown),
        costBreakdown,
        nextLevelDuration: computeDuration(blueprint, nextLevel),
        maxLevel: blueprint?.max_level ?? null,
      };
    });

    res.json(payload);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching training centers');
    res.status(500).json({ message: 'Error fetching training centers' });
  }
};

// Get details of a specific training center
exports.getTrainingDetails = async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training center not found' });
    }

    const blueprint = await blueprintRepository.findByCategoryAndType('unit', training.name);
    const nextLevel = Number(training.level || 0) + 1;
    const costBreakdown = computeCostBreakdown(blueprint, nextLevel);

    // On renvoie toutes les données + un alias nextLevelCost
    res.json({
      ...training.dataValues,
      description: training.description,
      nextLevelCost: sumCost(costBreakdown),
      costBreakdown,
      nextLevelDuration: computeDuration(blueprint, nextLevel),
      maxLevel: blueprint?.max_level ?? null,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching training details');
    res.status(500).json({ message: 'Error fetching training details' });
  }
};

const ActionQueue = require('../models/ActionQueue');
const sequelize = require('../db');

// Upgrade a specific training center with delay queue
exports.upgradeTraining = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const training = await Training.findByPk(req.params.id, { transaction });
    if (!training) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Training center not found' });
    }

    const blueprint = await blueprintRepository.findByCategoryAndType('unit', training.name);
    if (blueprint?.max_level && training.level >= blueprint.max_level) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Max level reached for this training' });
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
        entityId: training.id,
        type: 'training',
        status: ['queued', 'in_progress'],
      },
      transaction,
    });

    const nextLevel = (Number(training.level) || 0) + pendingCount + 1;
    const durationSeconds = blueprint ? (blueprint.base_duration_seconds || 0) * nextLevel : 0;

    // Find last queued action to set startTime
    const lastTask = await ActionQueue.findOne({
      where: { cityId: city.id, type: 'training' },
      order: [['slot', 'DESC']],
      transaction,
    });

    const startTime = lastTask && lastTask.finishTime ? new Date(lastTask.finishTime) : new Date();
    const finishTime = new Date(startTime.getTime() + durationSeconds * 1000);

    const queueItem = await ActionQueue.create({
      cityId: city.id,
      entityId: training.id,
      type: 'training',
      status: lastTask ? 'queued' : 'in_progress',
      startTime,
      finishTime,
      slot: lastTask ? lastTask.slot + 1 : 1,
    }, { transaction });

    await transaction.commit();

    // Emit event to notify client (optional, implement socket.io emit if needed)
    // const io = require('../socket').getIO();
    // io.to(`user_${req.user.id}`).emit('action_queue:update', { type: 'training', queue: queueItem });

    res.json({ message: 'Training upgrade queued', queueItem });
  } catch (error) {
    await transaction.rollback();
    (req.logger || logger).error({ err: error }, 'Error queuing training upgrade');
    res.status(500).json({ message: 'Error queuing training upgrade' });
  }
};

// Destroy a specific training center
exports.destroyTraining = async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training center not found' });
    }

    await training.destroy();
    (req.logger || logger).audit({ userId: req.user.id, trainingId: training.id }, 'Training destroyed');
    res.json({ message: 'Training center destroyed' });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error destroying training');
    res.status(500).json({ message: 'Error destroying training' });
  }
};
