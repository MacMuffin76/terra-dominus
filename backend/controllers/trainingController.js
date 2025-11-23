const Training = require('../models/Training');

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

const ensureUserTrainings = async (userId) => {
  const trainings = await Training.findAll({
    where: { user_id: userId },
  });

  const missingTypes = DEFAULT_TRAINING_TYPES.filter(
    (name) => !trainings.some((training) => training.name === name)
  );

  if (missingTypes.length > 0) {
    await Training.bulkCreate(
      missingTypes.map((name) => ({
        user_id: userId,
        name,
        level: 0,
        nextlevelcost: 0,
        description: null,
      }))
    );

    return Training.findAll({ where: { user_id: userId } });
  }

  return trainings;
};

// Get all training centers
exports.getTrainingCenters = async (req, res) => {
  try {
    const trainings = await ensureUserTrainings(req.user.id);
    res.json(trainings);
  } catch (error) {
    console.error('Error fetching training centers:', error);
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

    // On renvoie toutes les données + un alias nextLevelCost
    res.json({
      ...training.dataValues,
      description: training.description,
      nextLevelCost: training.nextlevelcost,
    });
  } catch (error) {
    console.error('Error fetching training details:', error);
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

    // Simple logique d'upgrade : level + 1
    training.level += 1;
    await training.save();

    res.json(training);
  } catch (error) {
    console.error('Error upgrading training:', error);
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
    res.json({ message: 'Training center destroyed' });
  } catch (error) {
    console.error('Error destroying training:', error);
    res.status(500).json({ message: 'Error destroying training' });
  }
};
