const SENSITIVE_KEYS = ['rngSeed', 'debug', 'internalLogs'];

class BattleReportService {
  constructor({ battleReportRepository }) {
    this.battleReportRepository = battleReportRepository;
  }

  sanitizePayload(payload = {}) {
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    SENSITIVE_KEYS.forEach((key) => {
      if (cleanPayload[key]) {
        delete cleanPayload[key];
      }
    });

    return cleanPayload;
  }

  async listForUser(userId, { page = 1, limit = 20 } = {}) {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const offset = (currentPage - 1) * safeLimit;

    const { rows, count } = await this.battleReportRepository.findForUser(userId, {
      limit: safeLimit,
      offset,
    });

    const reports = rows.map((report) => this.toClientReport(report, userId));

    return {
      pagination: {
        page: currentPage,
        limit: safeLimit,
        total: count,
        totalPages: Math.ceil(count / safeLimit),
      },
      data: reports,
    };
  }

  toClientReport(report, userId) {
    const role = report.attackerUserId === userId ? 'attacker' : 'defender';
    const payload = this.sanitizePayload(report.payload);
    const outcome = payload?.winner || 'draw';

    return {
      id: report.id,
      createdAt: report.createdAt,
      attackerCityId: report.attackerCityId,
      defenderCityId: report.defenderCityId,
      role,
      outcome,
      maxRoundsReached: payload.maxRoundsReached || false,
      summary: {
        attackerLosses: payload?.attacker?.losses || {},
        defenderLosses: payload?.defender?.losses || {},
        rounds: payload?.rounds?.length || 0,
      },
      payload,
    };
  }
}

module.exports = BattleReportService;