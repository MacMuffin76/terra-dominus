const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');
const { createResourceUpgradeWorker } = require('./workers/resourceUpgradeWorker');

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
  createResourceUpgradeWorker(container);
}

module.exports = { startJobs };