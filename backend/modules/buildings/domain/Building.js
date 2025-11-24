const { getBuildDurationSeconds, getProductionPerSecond } = require('../../../utils/balancing');

class Building {
  constructor({ id, city_id, name, level = 0, version = 0 }) {
    this.id = id;
    this.cityId = city_id;
    this.name = name;
    this.level = Number(level) || 0;
    this.version = Number(version) || 0;
  }

  getNextLevel(pending = 0) {
    return this.level + pending + 1;
  }

  getProductionPerSecond() {
    return getProductionPerSecond(this.name, this.level);
  }

  getUpgradeDuration(nextLevel) {
    return getBuildDurationSeconds(nextLevel);
  }

  incrementLevel() {
    return new Building({
      id: this.id,
      city_id: this.cityId,
      name: this.name,
      level: this.level + 1,
      version: this.version + 1,
    });
  }
}

module.exports = Building;