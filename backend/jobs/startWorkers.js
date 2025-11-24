require('dotenv').config();
const createContainer = require('../container');
const { startJobs } = require('./index');

const container = createContainer();

startJobs(container);

console.log('Background workers started');

const shutdown = async () => {
  console.log('Shutting down workers');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);