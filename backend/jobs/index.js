const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorker');

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
}

module.exports = { startJobs };