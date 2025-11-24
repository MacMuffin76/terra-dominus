const { createWorker, queueNames } = require('../queueConfig');
const { getIO } = require('../../socket');

function createCombatWorker(container) {
  return createWorker(queueNames.COMBAT, async (job) => {
    const { attackerFleet, defenderFleet, context = {} } = job.data || {};

    if (!attackerFleet || !defenderFleet) {
      job.log('Missing fleets in combat job payload');
      return;
    }

    const combatSimulationService = container.resolve('combatSimulationService');
    const { report, persistedReport } = await combatSimulationService.simulate(attackerFleet, defenderFleet, context);

    const io = getIO();
    if (io) {
      const attackerUserId = context.attackerUserId || attackerFleet.ownerId;
      const defenderUserId = context.defenderUserId || defenderFleet.ownerId;

      if (attackerUserId) {
        io.to(`user_${attackerUserId}`).emit('battle_report', report.toJSON());
      }
      if (defenderUserId) {
        io.to(`user_${defenderUserId}`).emit('battle_report', report.toJSON());
      }
    }

    job.updateProgress(100);
    return persistedReport;
  }, {
    concurrency: 2,
  });
}

module.exports = { createCombatWorker };