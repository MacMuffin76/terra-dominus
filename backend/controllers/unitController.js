// backend/controllers/unitController.js

const Unit = require('../models/Unit');
const { getUserMainCity } = require('../utils/cityUtils');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'UnitController' });

exports.getUserUnits = async (req, res) => {
  try {
    const city = await getUserMainCity(req.user.id);
    if (!city) {
      return res.status(404).json({ message: 'Pas de ville trouvée' });
    }

  const units = await Unit.findAll({
    where: { city_id: city.id },
  });

  res.json(units);
  } catch (error) {
    (req.logger || logger).error({ err: error }, 'Error fetching user units');
    res.status(500).json({ message: 'Error fetching user units' });
  }
};