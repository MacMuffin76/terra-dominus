const { simulateBattle } = require('../domain/simulation');

class CombatSimulationService {
  constructor({ battleReportRepository }) {
    this.battleReportRepository = battleReportRepository;
  }

  async simulate(attackerFleet, defenderFleet, context = {}) {
    const report = simulateBattle(attackerFleet, defenderFleet, context.options);

    const persistedReport = await this.battleReportRepository.create({
      attackerUserId: context.attackerUserId || attackerFleet.ownerId,
      defenderUserId: context.defenderUserId || defenderFleet.ownerId,
      attackerCityId: attackerFleet.originCityId,
      defenderCityId: defenderFleet.targetCityId || defenderFleet.originCityId,
      payload: report.toJSON(),
    });

    return { report, persistedReport };
  }
}

module.exports = CombatSimulationService;