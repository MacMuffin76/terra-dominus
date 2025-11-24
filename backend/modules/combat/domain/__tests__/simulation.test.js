const { simulateBattle } = require('../simulation');
const { fastAttackFleet, sturdyDefenseFleet, attritionFleet, fortifiedFleet } = require('../__fixtures__/fleets');

describe('simulateBattle', () => {
  it('gives the win to the attacker when offensive power overwhelms defense', () => {
    const report = simulateBattle(fastAttackFleet, sturdyDefenseFleet);

    expect(report.winner).toBe('attacker');
    expect(report.attacker.losses.Interceptor).toBeUndefined();
    expect(report.defender.final.squads.every((squad) => squad.count === 0)).toBe(true);
  });

  it('uses initiative to decide strike order', () => {
    const slowAttackers = {
      ...fastAttackFleet,
      squads: fastAttackFleet.squads.map((squad) => ({ ...squad, initiative: 1 })),
    };

    const report = simulateBattle(slowAttackers, sturdyDefenseFleet);
    const firstRound = report.rounds[0];
    const firstAction = firstRound.actions[0];

    expect(firstAction.side).toBe('defender');
    expect(firstAction.attacker).toBe('Sentinel');
  });

  it('stops after the configured number of rounds and reports a draw', () => {
    const report = simulateBattle(attritionFleet, fortifiedFleet, { maxRounds: 2 });

    expect(report.winner).toBe('draw');
    expect(report.maxRoundsReached).toBe(true);
    expect(report.rounds.length).toBe(2);
  });
});