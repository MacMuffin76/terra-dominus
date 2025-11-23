// backend/controllers/unitController.js

const Unit = require('../models/Unit');
const { getUserMainCity } = require('../utils/cityUtils');

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
    console.error('Error fetching user units:', error);
    res.status(500).json({ message: 'Error fetching user units' });
  }
};
