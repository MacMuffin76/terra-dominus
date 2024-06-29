const User = require('../models/User');
const Resource = require('../models/Resource');
const Building = require('../models/Building');
const Unit = require('../models/Unit');

exports.getDashboardData = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['username', 'level', 'points_experience', 'rang'],
    });
    const resources = await Resource.findAll({ where: { user_id: req.user.id } });
    const buildings = await Building.findAll({ where: { user_id: req.user.id } });
    const units = await Unit.findAll({ where: { user_id: req.user.id } });

    // Ajoutez un niveau par défaut pour chaque ressource si ce n'est pas déjà fait
    const resourcesWithLevels = resources.map(resource => ({
      ...resource.dataValues,
      level: resource.level || 1, // Assurez-vous qu'il y a un champ level pour chaque ressource
    }));

    res.json({ user, resources: resourcesWithLevels, buildings, units });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};
