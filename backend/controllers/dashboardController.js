// backend/controllers/dashboardController.js

const User      = require('../models/User');
const sequelize = require('../db');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'DashboardController' });

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    (req.logger || logger).info({ userId }, 'Fetching dashboard data for user');

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

    // Installations (Facilities) par ville
    const [facilities] = await sequelize.query(
      `
      SELECT f.*
      FROM facilities f
      JOIN cities c ON c.id = f.city_id
      WHERE c.user_id = :userId
      ORDER BY f.id
      `,
      { replacements: { userId } }
    );

    // Recherches de l'utilisateur
    const [researches] = await sequelize.query(
      `
      SELECT r.*
      FROM researches r
      WHERE r.user_id = :userId
      ORDER BY r.id
      `,
      { replacements: { userId } }
    );

    // Défenses par ville (optionnel, table peut ne pas exister)
    let defenses = [];
    try {
      const [defensesResult] = await sequelize.query(
        `
        SELECT d.*
        FROM defenses d
        JOIN cities c ON c.id = d.city_id
        WHERE c.user_id = :userId
        ORDER BY d.id
        `,
        { replacements: { userId } }
      );
      defenses = defensesResult;
    } catch (error) {
      // Table defenses n'existe pas ou autre erreur, on retourne un tableau vide
      (req.logger || logger).warn({ err: error }, 'Defenses table not found or error, returning empty array');
    }

    res.json({
      user,
      resources: resourcesWithLevels,
      buildings,
      units,
      facilities,
      researches,
      defenses,
    });
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching dashboard data');
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};