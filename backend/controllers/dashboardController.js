// backend/controllers/dashboardController.js

const User      = require('../models/User');
const sequelize = require('../db');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'DashboardController' });

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Infos du joueur
    const userData = await User.findByPk(userId, {
      attributes: ['username', 'points_experience', 'rang'],
    });

    if (!userData) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = {
      ...userData.dataValues,
      level: 1, // placeholder
    };

    // Ressources par ville
  const [resources] = await sequelize.query(
      `
      SELECT r.*
      FROM resources r
      JOIN cities c ON c.id = r.city_id
      WHERE c.user_id = :userId
      ORDER BY r.id
      `,
      { replacements: { userId } }
    );

    const resourcesWithLevels = resources.map((r) => ({
      ...r,
      level: r.level || 1,
    }));

    // Bâtiments par ville
    const [buildings] = await sequelize.query(
      `
      SELECT b.*
      FROM buildings b
      JOIN cities c ON c.id = b.city_id
      WHERE c.user_id = :userId
      ORDER BY b.id
      `,
      { replacements: { userId } }
    );

    // Unités par ville
    const [units] = await sequelize.query(
      `
      SELECT u.*
      FROM units u
      JOIN cities c ON c.id = u.city_id
      WHERE c.user_id = :userId
      ORDER BY u.id
      `,
      { replacements: { userId } }
    );

    res.json({
      user,
      resources: resourcesWithLevels,
      buildings,
      units,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching dashboard data');
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};