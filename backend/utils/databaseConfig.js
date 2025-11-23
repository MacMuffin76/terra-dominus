require('dotenv').config();

const buildConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_USER, DB_PASSWORD, DB_HOST = 'localhost', DB_PORT = '5432', DB_NAME } = process.env;

  if (DB_USER && DB_PASSWORD && DB_NAME) {
    return `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }

  throw new Error('Database connection string is not defined. Set DATABASE_URL or DB_* variables.');
};

const buildSslConfig = () => {
  if (process.env.DB_SSL === 'true') {
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    return { require: true, rejectUnauthorized };
  }

  return undefined;
};

const getSequelizeOptions = () => {
  const ssl = buildSslConfig();

  return {
    dialect: 'postgres',
    logging: false,
    dialectOptions: ssl ? { ssl } : undefined,
  };
};

const getPgClientConfig = () => {
  const ssl = buildSslConfig();

  return {
    connectionString: buildConnectionString(),
    ssl,
  };
};

module.exports = {
  buildConnectionString,
  getSequelizeOptions,
  getPgClientConfig,
};