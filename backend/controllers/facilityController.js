const Facility = require('../models/Facility');

// Get all facility buildings
exports.getFacilityBuildings = async (req, res) => {
  try {
    const facilities = await Facility.findAll({ where: { user_id: req.user.id } });
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facility buildings:', error);
    res.status(500).json({ message: 'Error fetching facility buildings' });
  }
};

// Get details of a specific facility building
exports.getFacilityDetails = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({
      ...facility.dataValues,
      description: facility.description,
      nextLevelCost: facility.nextlevelcost, // Use the actual next level cost from the model
    });
  } catch (error) {
    console.error('Error fetching facility details:', error);
    res.status(500).json({ message: 'Error fetching facility details' });
  }
};

// Upgrade a specific facility building
exports.upgradeFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    facility.level += 1; // Increment the level
    await facility.save();
    res.json(facility);
  } catch (error) {
    console.error('Error upgrading facility:', error);
    res.status(500).json({ message: 'Error upgrading facility' });
  }
};

// Destroy a specific facility building
exports.destroyFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    await facility.destroy();
    res.json({ message: 'Facility destroyed' });
  } catch (error) {
    console.error('Error destroying facility:', error);
    res.status(500).json({ message: 'Error destroying facility' });
  }
};
