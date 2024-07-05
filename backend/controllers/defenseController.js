const Defense = require('../models/Defense');
const ResourceCost = require('../models/ResourceCost');
const Entity = require('../models/Entity');

// Get all defenses
exports.getDefenses = async (req, res) => {
  try {
    const defenses = await Defense.findAll({ where: { user_id: req.user.id } });
    res.json(defenses);
  } catch (error) {
    console.error('Error fetching defenses:', error);
    res.status(500).json({ message: 'Error fetching defenses' });
  }
};

// Get details of a specific defense
exports.getDefenseDetails = async (req, res) => {
  try {
    const defense = await Defense.findByPk(req.params.id);
    if (!defense) {
      return res.status(404).json({ message: 'Defense not found' });
    }
    res.json({
      ...defense.dataValues,
      description: defense.description,
      cost: defense.cost,
    });
  } catch (error) {
    console.error('Error fetching defense details:', error);
    res.status(500).json({ message: 'Error fetching defense details' });
  }
};

// Upgrade a specific defense
exports.upgradeDefense = async (req, res) => {
  try {
    const defense = await Defense.findByPk(req.params.id);
    if (!defense) {
      return res.status(404).json({ message: 'Defense not found' });
    }
    defense.quantity += 1; // Increment the quantity
    await defense.save();
    res.json(defense);
  } catch (error) {
    console.error('Error upgrading defense:', error);
    res.status(500).json({ message: 'Error upgrading defense' });
  }
};

// Destroy a specific defense
exports.destroyDefense = async (req, res) => {
  try {
    const defense = await Defense.findByPk(req.params.id);
    if (!defense) {
      return res.status(404).json({ message: 'Defense not found' });
    }
    await defense.destroy();
    res.json({ message: 'Defense destroyed' });
  } catch (error) {
    console.error('Error destroying defense:', error);
    res.status(500).json({ message: 'Error destroying defense' });
  }
};
