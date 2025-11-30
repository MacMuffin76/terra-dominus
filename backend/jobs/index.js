const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');
const { createResourceUpgradeWorker } = require('./workers/resourceUpgradeWorker');
const { createColonizationWorker } = require('./workers/colonizationWorker');
const { createAttackWorker } = require('./workers/attackWorker');
const { createSpyWorker } = require('./workers/spyWorker');
const { createTradeWorker } = require('./workers/tradeWorker');
const createPortalSpawningJob = require('./portalSpawningJob');
const createQuestRotationJob = require('./questRotationJob');
const { startUpkeepJob, stopUpkeepJob } = require('./upkeepJob');

let portalJobs = null;
let questJobs = null;
let upkeepJobStarted = false;

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
  createResourceUpgradeWorker(container);
  createColonizationWorker(container);
  createAttackWorker(container);
  createSpyWorker(container);
  createTradeWorker(container);
  
  // Portal cron jobs (new system)
  portalJobs = createPortalSpawningJob(container);
  portalJobs.start();
  
  // Quest rotation cron jobs
  questJobs = createQuestRotationJob(container);
  questJobs.start();
  
  // Upkeep job (hourly)
  startUpkeepJob(container);
  upkeepJobStarted = true;
}

function stopJobs() {
  if (portalJobs) {
    portalJobs.stop();
  }
  if (questJobs) {
    questJobs.stop();
  }
  if (upkeepJobStarted) {
    stopUpkeepJob();
  }
}

module.exports = { startJobs, stopJobs };