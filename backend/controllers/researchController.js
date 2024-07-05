const Research = require('../models/Research');
const ResourceCost = require('../models/ResourceCost');
const Entity = require('../models/Entity');

// Get all research items
exports.getResearchItems = async (req, res) => {
  try {
    const researches = await Research.findAll({ where: { user_id: req.user.id } });
    res.json(researches);
  } catch (error) {
    console.error('Error fetching research items:', error);
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
    res.json({
      ...research.dataValues,
      description: research.description,
      nextLevelCost: research.nextlevelcost,
    });
  } catch (error) {
    console.error('Error fetching research details:', error);
    res.status(500).json({ message: 'Error fetching research details' });
  }
};

// Upgrade a specific research item
exports.upgradeResearch = async (req, res) => {
  try {
    const research = await Research.findByPk(req.params.id);
    if (!research) {
      return res.status(404).json({ message: 'Research not found' });
    }
    research.level += 1;
    await research.save();
    res.json(research);
  } catch (error) {
    console.error('Error upgrading research:', error);
    res.status(500).json({ message: 'Error upgrading research' });
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
    res.json({ message: 'Research destroyed' });
  } catch (error) {
    console.error('Error destroying research:', error);
    res.status(500).json({ message: 'Error destroying research' });
  }
};
