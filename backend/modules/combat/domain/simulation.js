const BattleReport = require('./BattleReport');
const Fleet = require('./Fleet');

function sortInitiative(initiatives) {
  return initiatives.sort((a, b) => {
    if (b.squad.initiative !== a.squad.initiative) {
      return b.squad.initiative - a.squad.initiative;
    }
    if (a.side !== b.side) {
      return a.side === 'attacker' ? -1 : 1;
    }
    return a.squad.unitType.localeCompare(b.squad.unitType);
  });
}

function selectTarget(squads) {
  return squads
    .filter((squad) => squad.isAlive())
    .sort((a, b) => {
      const powerDiff = b.getAttackPower() - a.getAttackPower();
      if (powerDiff !== 0) return powerDiff;
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      return a.unitType.localeCompare(b.unitType);
    })[0];
}

function buildSnapshot(fleet) {
  return {
    snapshot: fleet.getSnapshot(),
    losses: {},
  };
}

function computeLosses(initial, current) {
  const losses = {};
  initial.squads.forEach((initialSquad) => {
    const currentSquad = current.squads.find((s) => s.unitType === initialSquad.unitType);
    const currentCount = currentSquad ? currentSquad.count : 0;
    const lost = Math.max(0, initialSquad.count - currentCount);
    if (lost > 0) {
      losses[initialSquad.unitType] = lost;
    }
  });
  return losses;
}

function simulateBattle(attackerInput, defenderInput, options = {}) {
  const attacker = Fleet.fromJSON(attackerInput).clone();
  const defender = Fleet.fromJSON(defenderInput).clone();
  const maxRounds = options.maxRounds || 50;

  const attackerState = buildSnapshot(attacker);
  const defenderState = buildSnapshot(defender);
  const rounds = [];

  let currentRound = 1;
  let maxRoundsReached = false;

  while (!attacker.isDefeated() && !defender.isDefeated() && currentRound <= maxRounds) {
    const roundActions = [];
    const initiativeOrder = sortInitiative([
      ...attacker.getAliveSquads().map((squad) => ({ side: 'attacker', squad })),
      ...defender.getAliveSquads().map((squad) => ({ side: 'defender', squad })),
    ]);

    for (const entry of initiativeOrder) {
      const actingFleet = entry.side === 'attacker' ? attacker : defender;
      const targetFleet = entry.side === 'attacker' ? defender : attacker;
      const squad = entry.squad;

      if (!squad.isAlive() || targetFleet.isDefeated()) continue;

      const target = selectTarget(targetFleet.getAliveSquads());
      if (!target) continue;

      const attackPower = squad.getAttackPower();
      const { casualties, damage } = target.applyDamage(attackPower);

      roundActions.push({
        side: entry.side,
        attacker: squad.unitType,
        target: target.unitType,
        damage,
        casualties,
      });
    }

    rounds.push({ number: currentRound, actions: roundActions });
    currentRound += 1;
  }

  if (currentRound > maxRounds && !attacker.isDefeated() && !defender.isDefeated()) {
    maxRoundsReached = true;
  }

  const winner = attacker.isDefeated() && defender.isDefeated()
    ? 'draw'
    : attacker.isDefeated()
      ? 'defender'
      : defender.isDefeated()
        ? 'attacker'
        : 'draw';

  const finalAttackerSnapshot = attacker.getSnapshot();
  const finalDefenderSnapshot = defender.getSnapshot();

  const attackerLosses = computeLosses(attackerState.snapshot, finalAttackerSnapshot);
  const defenderLosses = computeLosses(defenderState.snapshot, finalDefenderSnapshot);

  const attackerReport = {
    initial: attackerState.snapshot,
    final: finalAttackerSnapshot,
    losses: attackerLosses,
  };

  const defenderReport = {
    initial: defenderState.snapshot,
    final: finalDefenderSnapshot,
    losses: defenderLosses,
  };

  return BattleReport.fromSimulation({
    attacker: attackerReport,
    defender: defenderReport,
    rounds,
    winner,
    maxRoundsReached,
  });
}

module.exports = {
  simulateBattle,
};