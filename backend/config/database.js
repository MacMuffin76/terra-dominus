const { buildConnectionString, getSequelizeOptions } = require('../utils/databaseConfig');

module.exports = {
  development: {
    url: buildConnectionString(),
    ...getSequelizeOptions()
  },
  test: {
    url: buildConnectionString(),
    ...getSequelizeOptions()
  },
  production: {
    url: buildConnectionString(),
    ...getSequelizeOptions()
  }
};
