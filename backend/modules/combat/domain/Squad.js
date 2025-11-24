class Squad {
  constructor({ unitType, attack, defense, initiative, count }) {
    this.unitType = unitType;
    this.attack = Number(attack) || 0;
    this.defense = Number(defense) || 1;
    this.initiative = Number(initiative) || 0;
    this.count = Number(count) || 0;
  }

  static fromJSON(data) {
    return new Squad(data);
  }

  clone() {
    return new Squad({
      unitType: this.unitType,
      attack: this.attack,
      defense: this.defense,
      initiative: this.initiative,
      count: this.count,
    });
  }

  isAlive() {
    return this.count > 0;
  }

  getAttackPower() {
    return this.count * this.attack;
  }

  applyDamage(rawDamage) {
    if (!this.isAlive()) return { casualties: 0, damage: rawDamage };

    const normalizedDamage = Math.max(0, rawDamage);
    const potentialCasualties = Math.floor(normalizedDamage / this.defense);
    const casualties = Math.min(this.count, potentialCasualties);
    this.count -= casualties;

    return { casualties, damage: normalizedDamage };
  }
}

module.exports = Squad;