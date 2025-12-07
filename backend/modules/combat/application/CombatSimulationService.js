const { simulateBattle } = require('../domain/simulation');
const NotificationService = require('../../../utils/notificationService');

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

    if (persistedReport.attackerUserId) {
      NotificationService.sendToUser(
        persistedReport.attackerUserId,
        NotificationService.TYPES.COMBAT_RESULT,
        {
          title: '⚔️ Rapport de bataille',
          message: report.winner === 'attacker' ? 'Victoire de votre attaque' : 'Défaite de votre attaque',
          link: '/battle-reports',
        },
        NotificationService.PRIORITIES.HIGH,
      );
    }

    if (persistedReport.defenderUserId) {
      NotificationService.sendToUser(
        persistedReport.defenderUserId,
        NotificationService.TYPES.COMBAT_RESULT,
        {
          title: '🛡️ Rapport de bataille',
          message: report.winner === 'defender' ? 'Victoire de votre défense' : 'Défaite de votre défense',
          link: '/battle-reports',
        },
        NotificationService.PRIORITIES.HIGH,
      );
    }

    return { report, persistedReport };
  }
}

module.exports = CombatSimulationService;