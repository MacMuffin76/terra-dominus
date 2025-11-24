const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
}

module.exports = { startJobs };