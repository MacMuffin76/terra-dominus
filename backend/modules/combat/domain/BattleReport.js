class BattleReport {
  constructor({ attacker, defender, rounds, winner, maxRoundsReached = false }) {
    this.attacker = attacker;
    this.defender = defender;
    this.rounds = rounds;
    this.winner = winner;
    this.maxRoundsReached = maxRoundsReached;
  }

  static fromSimulation({ attacker, defender, rounds, winner, maxRoundsReached }) {
    return new BattleReport({ attacker, defender, rounds, winner, maxRoundsReached });
  }

  toJSON() {
    return {
      attacker: this.attacker,
      defender: this.defender,
      rounds: this.rounds,
      winner: this.winner,
      maxRoundsReached: this.maxRoundsReached,
    };
  }
}

module.exports = BattleReport;