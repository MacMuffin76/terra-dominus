require('dotenv').config();
const createContainer = require('../container');
const { startJobs } = require('./index');
const { getLogger } = require('../utils/logger');

const container = createContainer();
const logger = getLogger({ module: 'workers' });

startJobs(container);

logger.info('Background workers started');

const shutdown = async () => {
  logger.info('Shutting down workers');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);