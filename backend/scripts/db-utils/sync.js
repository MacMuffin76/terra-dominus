const sequelize = require('./db');
const Defense = require('./models/Defense');
const { getLogger } = require('./utils/logger');

const logger = getLogger({ module: 'sync' });

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // 'alter' met à jour les tables existantes pour correspondre au modèle
    logger.info('Database synchronized successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error synchronizing the database');
  } finally {
    await sequelize.close();
  }
};

syncDB();