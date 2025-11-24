const BattleReportModel = require('../../../models/BattleReport');

class BattleReportRepository {
  async create({ attackerUserId, defenderUserId, attackerCityId, defenderCityId, payload }) {
    const record = await BattleReportModel.create({
      attackerUserId,
      defenderUserId,
      attackerCityId,
      defenderCityId,
      payload,
    });

    return record.toJSON();
  }
}

module.exports = BattleReportRepository;