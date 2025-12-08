const { createConstructionWorker } = require('./workers/constructionWorker');
const { createProductionWorker } = require('./workers/productionWorkers');
const { createCombatWorker } = require('./workers/combatWorker');
const { createResourceUpgradeWorker } = require('./workers/resourceUpgradeWorker');
const { createFacilityUpgradeWorker } = require('./workers/facilityUpgradeWorker');
const { createColonizationWorker } = require('./workers/colonizationWorker');
const { createAttackWorker } = require('./workers/attackWorker');
const { createSpyWorker } = require('./workers/spyWorker');
const { createTradeWorker } = require('./workers/tradeWorker');
const createPortalSpawningJob = require('./portalSpawningJob');
const createQuestRotationJob = require('./questRotationJob');
const { startUpkeepJob, stopUpkeepJob } = require('./upkeepJob');
const { updateLeaderboards } = require('./leaderboardUpdateJob'); // Import du nouveau job
const territoryResourceJob = require('./territoryResourceJob');
const createResearchQueueJob = require('./researchQueueJob');

let portalJobs = null;
let questJobs = null;
let upkeepJobStarted = false;
let leaderboardInterval = null; // Variable pour stocker l'intervalle
let researchQueueJob = null;

function startJobs(container) {
  createConstructionWorker(container);
  createProductionWorker(container);
  createCombatWorker(container);
  createResourceUpgradeWorker(container);
  createFacilityUpgradeWorker(container);
  createColonizationWorker(container);
  createAttackWorker(container);
  createSpyWorker(container);
  createTradeWorker(container);

  researchQueueJob = createResearchQueueJob(container);
  researchQueueJob.start();
  
  // Portal cron jobs (new system)
  portalJobs = createPortalSpawningJob(container);
  portalJobs.start();
  
  // Quest rotation cron jobs
  questJobs = createQuestRotationJob(container);
  questJobs.start();
  
  // Upkeep job (hourly)
  startUpkeepJob(container);
  upkeepJobStarted = true;
  
  // Territory resource job (hourly)
  territoryResourceJob.start();
  
  // Lancer le job de mise à jour des leaderboards toutes les 5 minutes
  leaderboardInterval = setInterval(() => {
    updateLeaderboards();
  }, 5 * 60 * 1000); // 5 minutes en millisecondes
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
  if (leaderboardInterval) {
    clearInterval(leaderboardInterval);
    leaderboardInterval = null;
  }
  if (researchQueueJob) {
    researchQueueJob.stop();
    researchQueueJob = null;
  }
}

module.exports = { startJobs, stopJobs };
