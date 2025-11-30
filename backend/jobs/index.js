const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');
const { createResourceUpgradeWorker } = require('./workers/resourceUpgradeWorker');
const { createColonizationWorker } = require('./workers/colonizationWorker');
const { createAttackWorker } = require('./workers/attackWorker');
const { createSpyWorker } = require('./workers/spyWorker');
const { createTradeWorker } = require('./workers/tradeWorker');
const { createPortalSpawnWorker, createPortalResolutionWorker, schedulePortalSpawning } = require('./workers/portalWorker');
const { getQueue, queueNames } = require('./queueConfig');

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
  createResourceUpgradeWorker(container);
  createColonizationWorker(container);
  createAttackWorker(container);
  createSpyWorker(container);
  createTradeWorker(container);
  
  // Portal workers
  createPortalSpawnWorker(container);
  createPortalResolutionWorker(container);
  
  // Schedule recurring portal spawning
  const portalQueue = getQueue(queueNames.PORTAL);
  schedulePortalSpawning(portalQueue);
}

module.exports = { startJobs };