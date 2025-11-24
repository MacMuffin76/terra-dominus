const Squad = require('./Squad');

class Fleet {
  constructor({ id, ownerId, originCityId, targetCityId, squads = [] }) {
    this.id = id;
    this.ownerId = ownerId;
    this.originCityId = originCityId;
    this.targetCityId = targetCityId;
    this.squads = squads.map((squad) => (squad instanceof Squad ? squad.clone() : new Squad(squad)));
  }

  static fromJSON(data = {}) {
    return new Fleet(data);
  }

  clone() {
    return new Fleet({
      id: this.id,
      ownerId: this.ownerId,
      originCityId: this.originCityId,
      targetCityId: this.targetCityId,
      squads: this.squads.map((s) => s.clone()),
    });
  }

  getAliveSquads() {
    return this.squads.filter((squad) => squad.isAlive());
  }

  isDefeated() {
    return this.getAliveSquads().length === 0;
  }

  getSnapshot() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      originCityId: this.originCityId,
      targetCityId: this.targetCityId,
      squads: this.squads.map((squad) => ({
        unitType: squad.unitType,
        attack: squad.attack,
        defense: squad.defense,
        initiative: squad.initiative,
        count: squad.count,
      })),
    };
  }
}

module.exports = Fleet;