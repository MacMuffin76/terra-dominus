const { Sequelize } = require('sequelize');
const { buildConnectionString, getSequelizeOptions } = require('./utils/databaseConfig');
const { getLogger } = require('./utils/logger');


const connectionString = buildConnectionString();
const sequelize = new Sequelize(connectionString, getSequelizeOptions());
const logger = getLogger({ module: 'sequelize' });

sequelize
  .authenticate()
  .then(() => {
    logger.info('Connection has been established successfully.');
  })
  .catch((err) => {
    logger.error({ err }, 'Unable to connect to the database');
  });

module.exports = sequelize;