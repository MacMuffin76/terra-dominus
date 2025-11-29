const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');
const { createResourceUpgradeWorker } = require('./workers/resourceUpgradeWorker');
const { createColonizationWorker } = require('./workers/colonizationWorker');
const { createAttackWorker } = require('./workers/attackWorker');
const { createSpyWorker } = require('./workers/spyWorker');
const { createTradeWorker } = require('./workers/tradeWorker');

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
  createResourceUpgradeWorker(container);
  createColonizationWorker(container);
  createAttackWorker(container);
  createSpyWorker(container);
  createTradeWorker(container);
}

module.exports = { startJobs };