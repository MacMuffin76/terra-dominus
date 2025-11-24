const Training = require('../models/Training');
const BlueprintRepository = require('../repositories/BlueprintRepository');
const { getLogger } = require('../utils/logger');

const blueprintRepository = new BlueprintRepository();
const logger = getLogger({ module: 'TrainingController' });

const DEFAULT_TRAINING_TYPES = [
  'Drone d’assaut terrestre',
  'Fantassin plasmique',
  'Infiltrateur holo-camouflage',
  'Tireur à antimatière',
  'Artilleur à railgun',
  'Exo-sentinelle',
  'Commandos nano-armure',
  'Légionnaire quantique',
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

const ensureUserTrainings = async (userId) => {
  const trainings = await Training.findAll({
    where: { user_id: userId },
  });

  const blueprints = await blueprintRepository.listByCategory('unit');
  const expectedTypes = blueprints.length ? blueprints.map((bp) => bp.type) : DEFAULT_TRAINING_TYPES;

  const missingTypes = expectedTypes.filter(
    (name) => !trainings.some((training) => training.name === name)
  );

  if (missingTypes.length > 0) {
    await Training.bulkCreate(
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

// Upgrade a specific training center
exports.upgradeTraining = async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) {
      return res.status(404).json({ message: 'Training center not found' });
    }

    const blueprint = await blueprintRepository.findByCategoryAndType('unit', training.name);
    if (blueprint?.max_level && training.level >= blueprint.max_level) {
      return res.status(400).json({ message: 'Max level reached for this training' });
    }

    const nextLevel = Number(training.level || 0) + 1;
    const followingCost = computeCostBreakdown(blueprint, nextLevel + 1);

    // Simple logique d'upgrade : level + 1
    training.level = nextLevel;
    training.nextlevelcost = sumCost(followingCost);
    await training.save();

    (req.logger || logger).audit({ userId: req.user.id, trainingId: training.id }, 'Training upgraded');
    res.json({
      ...training.toJSON(),
      nextLevelCost: training.nextlevelcost,
      costBreakdown: followingCost,
      nextLevelDuration: computeDuration(blueprint, nextLevel + 1),
      maxLevel: blueprint?.max_level ?? null,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error upgrading training');
    res.status(500).json({ message: 'Error upgrading training' });
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