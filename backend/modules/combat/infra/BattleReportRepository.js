const BattleReportModel = require('../../../models/BattleReport');
const { Op } = require('sequelize');

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

  async findForUser(userId, { limit = 20, offset = 0 } = {}) {
    const query = {
      where: {
        [Op.or]: [{ attackerUserId: userId }, { defenderUserId: userId }],
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    };

    const { rows, count } = await BattleReportModel.findAndCountAll(query);
    return { rows: rows.map((r) => r.toJSON()), count };
  }
}

module.exports = BattleReportRepository;