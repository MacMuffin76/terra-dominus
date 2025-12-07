import React, { useEffect, useMemo, useState } from 'react';
import { fetchBattleReports } from '../api/battleReports';
import Loader from '../components/ui/Loader';
import { Alert } from '../components/ui';

const formatDate = (value) => new Date(value).toLocaleString();

const SummaryRow = ({ label, value }) => (
  <div className="summary-row">
    <span className="summary-label">{label}</span>
    <span className="summary-value">{value}</span>
  </div>
);

const LossesList = ({ losses }) => (
  <div className="losses">
    {Object.keys(losses || {}).length === 0 && <span className="muted">Aucune perte</span>}
    {Object.entries(losses || {}).map(([unit, count]) => (
      <div key={unit} className="losses-row">
        <span>{unit}</span>
        <span className="pill">-{count}</span>
      </div>
    ))}
  </div>
);

const RoundLog = ({ rounds }) => (
  <div className="rounds">
    {rounds?.map((round) => (
      <details key={round.number} className="round-card">
        <summary>Round {round.number}</summary>
        <ul>
          {round.actions.map((action, idx) => (
            <li key={idx}>
              <strong>{action.side}</strong> {action.attacker} → {action.target} ({action.casualties} pertes / {Math.round(action.damage)} dégâts)
            </li>
          ))}
        </ul>
      </details>
    ))}
  </div>
);

const BattleReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({ role: 'all', outcome: 'all', search: '' });

  const loadReports = async (page = 1) => {
    try {
      setLoading(true);
      const result = await fetchBattleReports({ page, limit: pagination.limit });
      setReports(result.data || []);
      setPagination(result.pagination || { page: 1, limit: 10, totalPages: 1 });
      if (!selectedReport && result.data?.length) {
        setSelectedReport(result.data[0]);
      }
    } catch (err) {
      setError(err?.message || 'Impossible de charger les rapports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesRole = filters.role === 'all' || report.role === filters.role;
      const matchesOutcome = filters.outcome === 'all' || report.outcome === filters.outcome;
      const matchesSearch =
        !filters.search ||
        report.id.toString().includes(filters.search) ||
        report.outcome.includes(filters.search);
      return matchesRole && matchesOutcome && matchesSearch;
    });
  }, [reports, filters]);

  const handleExport = (report) => {
    const blob = new Blob([JSON.stringify(report.payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle-report-${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async (report) => {
    const shareData = {
      title: 'Battle report',
      text: `Rapport #${report.id} (${report.outcome})`,
      url: window.location.origin + '/battle-reports',
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      alert('Lien copié dans le presse-papiers');
    }
  };

  const loot = selectedReport?.payload?.loot || {};

  return (
    <div className="page battle-reports">
      <header className="page-header">
        <div>
          <p className="eyebrow">Journal de combat</p>
          <h1>Battle Reports</h1>
          <p className="muted">Filtrez, explorez et partagez vos combats récents.</p>
        </div>
        <div className="filters">
          <label>
            Rôle
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="all">Tous</option>
              <option value="attacker">Attaquant</option>
              <option value="defender">Défenseur</option>
            </select>
          </label>
          <label>
            Issue
            <select value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
              <option value="all">Toutes</option>
              <option value="attacker">Victoire attaquant</option>
              <option value="defender">Victoire défenseur</option>
              <option value="draw">Égalité</option>
            </select>
          </label>
          <label>
            Recherche
            <input
              type="search"
              placeholder="ID ou statut"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
        </div>
      </header>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
      {loading && <Loader label="Chargement des rapports" center />}

      {!loading && (
        <div className="reports-grid">
          <section className="reports-list">
            <div className="reports-header">
              <h2>Rapports ({filteredReports.length})</h2>
              <div className="pagination">
                <button disabled={pagination.page <= 1} onClick={() => loadReports(pagination.page - 1)}>Précédent</button>
                <span>
                  Page {pagination.page} / {pagination.totalPages || 1}
                </span>
                <button
                  disabled={pagination.page >= (pagination.totalPages || 1)}
                  onClick={() => loadReports(pagination.page + 1)}
                >
                  Suivant
                </button>
              </div>
            </div>

            <ul className="report-cards">
              {filteredReports.map((report) => (
                <li
                  key={report.id}
                  className={`report-card ${selectedReport?.id === report.id ? 'active' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="report-meta">
                    <span className="pill">#{report.id}</span>
                    <span className={`pill outcome-${report.outcome}`}>{report.outcome}</span>
                    <span className="muted">{formatDate(report.createdAt)}</span>
                  </div>
                  <div className="report-summary">
                    <SummaryRow label="Rôle" value={report.role} />
                    <SummaryRow label="Tours" value={report.summary.rounds} />
                    <SummaryRow
                      label="Pertes"
                      value={`Atk ${Object.keys(report.summary.attackerLosses).length} / Def ${Object.keys(report.summary.defenderLosses).length}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="report-detail">
            {selectedReport ? (
              <div className="panel">
                <header className="panel-header">
                  <div>
                    <p className="eyebrow">Rapport #{selectedReport.id}</p>
                    <h2>
                      {selectedReport.outcome === 'draw'
                        ? 'Égalité'
                        : selectedReport.outcome === 'attacker'
                          ? 'Victoire attaquant'
                          : 'Victoire défenseur'}
                    </h2>
                    <p className="muted">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  <div className="actions">
                    <button onClick={() => handleExport(selectedReport)}>Exporter JSON</button>
                    <button onClick={() => handleShare(selectedReport)}>Partager</button>
                  </div>
                </header>

                <div className="two-col">
                  <div>
                    <h3>Attaquant</h3>
                    <LossesList losses={selectedReport.summary.attackerLosses} />
                  </div>
                  <div>
                    <h3>Défenseur</h3>
                    <LossesList losses={selectedReport.summary.defenderLosses} />
                  </div>
                </div>

                <div className="panel-section">
                  <h3>Rounds</h3>
                  <RoundLog rounds={selectedReport.payload.rounds} />
                </div>

                <div className="panel-section">
                  <h3>Butin</h3>
                  {Object.keys(loot).length === 0 ? (
                    <p className="muted">Aucun loot enregistré</p>
                  ) : (
                    <ul className="loot-list">
                      {Object.entries(loot).map(([resource, amount]) => (
                        <li key={resource}>
                          <span>{resource}</span>
                          <span className="pill">+{amount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted">Sélectionnez un rapport pour voir le détail.</p>
            )}
          </section>
        </div>
      )}

      <style>{`
        .page.battle-reports { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .filters label { display: flex; flex-direction: column; font-size: 14px; gap: 4px; }
        .filters select, .filters input { padding: 8px; border-radius: 6px; border: 1px solid #d9d9d9; }
        .eyebrow { text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: #8a8a8a; }
        .muted { color: #6b7280; }
        .reports-grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
        .reports-header { display: flex; align-items: center; justify-content: space-between; }
        .pagination { display: flex; align-items: center; gap: 8px; }
        .report-cards { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
        .report-card { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; cursor: pointer; background: #fff; }
        .report-card.active { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
        .report-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px; margin-top: 8px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 14px; }
        .summary-label { color: #6b7280; }
        .pill { background: #f3f4f6; border-radius: 999px; padding: 2px 8px; font-size: 12px; }
        .outcome-attacker { background: #dcfce7; }
        .outcome-defender { background: #fee2e2; }
        .outcome-draw { background: #e0f2fe; }
        .report-detail .panel { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #fff; }
        .panel-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .actions { display: flex; gap: 8px; }
        button { border: 1px solid #e5e7eb; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .two-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px; }
        .losses { border: 1px dashed #e5e7eb; padding: 10px; border-radius: 8px; background: #f9fafb; }
        .losses-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .round-card { margin-bottom: 8px; border: 1px solid #e5e7eb; padding: 8px; border-radius: 8px; background: #f9fafb; }
        .panel-section { margin-top: 16px; }
        .loot-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
        .rounds ul { padding-left: 16px; }
        @media (max-width: 960px) {
          .reports-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default BattleReports;