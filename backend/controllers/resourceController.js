const Building = require('../models/Building');

exports.getResourceBuildings = async (req, res) => {
  try {
    const buildings = await Building.findAll({ where: { user_id: req.user.id } });
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching resource buildings:', error);
    res.status(500).json({ message: 'Error fetching resource buildings' });
  }
};

exports.getBuildingDetails = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    res.json({
      ...building.dataValues,
      description: 'Description du bâtiment...',
      nextLevelCost: 'Coût du prochain niveau...',
    });
  } catch (error) {
    console.error('Error fetching building details:', error);
    res.status(500).json({ message: 'Error fetching building details' });
  }
};

exports.upgradeBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    building.level += 1;
    await building.save();
    res.json(building);
  } catch (error) {
    console.error('Error upgrading building:', error);
    res.status(500).json({ message: 'Error upgrading building' });
  }
};

exports.destroyBuilding = async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    await building.destroy();
    res.json({ message: 'Building destroyed' });
  } catch (error) {
    console.error('Error destroying building:', error);
    res.status(500).json({ message: 'Error destroying building' });
  }
};
