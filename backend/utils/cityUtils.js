// backend/utils/cityUtils.js
const City = require('../models/City');

async function getUserMainCity(userId, options = {}) {
  // On essaie d'abord la capitale
  let city = await City.findOne({
    where: { user_id: userId, is_capital: true },
    order: [['id', 'ASC']],
    ...options,
  });

  // Sinon la première ville trouvée
  if (!city) {
    city = await City.findOne({
      where: { user_id: userId },
      order: [['id', 'ASC']],
      ...options,
    });
  }

  return city;
}

module.exports = { getUserMainCity };
