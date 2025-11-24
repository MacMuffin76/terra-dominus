const path = require('path');

// Load environment variables from backend/.env first, then fall back to the repo root.
// This avoids silent failures when the .env file is placed at the project root while the
// server is launched from the backend directory.
const backendEnvPath = path.resolve(__dirname, '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');

require('dotenv').config({ path: backendEnvPath });
// Load root-level variables without overriding backend/.env or existing env vars so missing
// values can be filled while preserving higher-priority ones.
require('dotenv').config({ path: rootEnvPath, override: false });

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
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: ssl ? { ssl } : undefined,
  };
};

module.exports = { buildConnectionString, getSequelizeOptions };