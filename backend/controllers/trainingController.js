const Training = require('../models/Training');

// Get all training centers
exports.getTrainingCenters = async (req, res) => {
  try {
    const trainings = await Training.findAll({ where: { user_id: req.user.id } });
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
    training.level += 1; // Increment the level
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
