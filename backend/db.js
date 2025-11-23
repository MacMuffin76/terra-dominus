const { Sequelize } = require('sequelize');
const { buildConnectionString, getSequelizeOptions } = require('./utils/databaseConfig');


const connectionString = buildConnectionString();
const sequelize = new Sequelize(connectionString, getSequelizeOptions());

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
  });

module.exports = sequelize;
