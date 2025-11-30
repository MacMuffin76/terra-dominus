/**
 * PortalHistoryPanel Component
 * Display user's portal battle history
 */

import React, { useState } from 'react';
import './PortalHistoryPanel.css';

const TIER_CONFIG = {
  grey: { name: 'Gris', rank: 'E', color: '#808080' },
  green: { name: 'Vert', rank: 'D', color: '#00FF00' },
  blue: { name: 'Bleu', rank: 'C', color: '#0099FF' },
  purple: { name: 'Violet', rank: 'B', color: '#9933FF' },
  red: { name: 'Rouge', rank: 'A', color: '#FF0000' },
  golden: { name: 'Doré', rank: 'S', color: '#FFD700' }
};

const PortalHistoryPanel = ({ history, onRefresh, onLoadMore }) => {
  const [filterResult, setFilterResult] = useState('all'); // all | victory | defeat
  const [filterTier, setFilterTier] = useState('all');

  if (!history || history.length === 0) {
    return (
      <div className="history-empty">
        <p>Aucun historique de combats pour le moment.</p>
        <p>Attaquez des portails pour commencer votre aventure!</p>
      </div>
    );
  }

  const filteredHistory = history.filter(record => {
    if (filterResult !== 'all' && record.result !== filterResult) return false;
    if (filterTier !== 'all' && record.tier !== filterTier) return false;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUnits = (units) => {
    if (!units) return 'N/A';
    try {
      const unitsObj = typeof units === 'string' ? JSON.parse(units) : units;
      return Object.entries(unitsObj)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');
    } catch {
      return 'Données corrompues';
    }
  };

  const formatRewards = (rewards) => {
    if (!rewards) return 'Aucune';
    try {
      const rewardsObj = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
      return Object.entries(rewardsObj)
        .map(([type, amount]) => `${amount.toLocaleString()} ${type}`)
        .join(', ');
    } catch {
      return 'Données corrompues';
    }
  };

  const getResultIcon = (result) => {
    return result === 'victory' ? '✅' : '❌';
  };

  const getResultClass = (result) => {
    return result === 'victory' ? 'victory' : 'defeat';
  };

  return (
    <div className="portal-history-panel">
      <div className="history-header">
        <h3>Historique des Combats</h3>
        <button className="btn-refresh" onClick={onRefresh}>
          🔄 Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Résultat:</label>
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
            <option value="all">Tous</option>
            <option value="victory">Victoires</option>
            <option value="defeat">Défaites</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rang:</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">Tous</option>
            {Object.entries(TIER_CONFIG).map(([tier, config]) => (
              <option key={tier} value={tier}>{config.rank} - {config.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="history-table-container">
        {filteredHistory.length === 0 ? (
          <div className="no-results">
            Aucun combat ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Portail</th>
                <th>Résultat</th>
                <th>Unités Envoyées</th>
                <th>Pertes</th>
                <th>Récompenses</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record) => {
                const tierConfig = TIER_CONFIG[record.tier] || TIER_CONFIG.grey;
                
                return (
                  <tr key={record.attempt_id} className={getResultClass(record.result)}>
                    <td className="date-cell">{formatDate(record.attempted_at)}</td>
                    <td className="tier-cell">
                      <span 
                        className="tier-badge" 
                        style={{ 
                          background: tierConfig.color,
                          color: '#000'
                        }}
                      >
                        {tierConfig.rank}
                      </span>
                      <span className="tier-name">{tierConfig.name}</span>
                    </td>
                    <td className={`result-cell ${getResultClass(record.result)}`}>
                      <span className="result-icon">{getResultIcon(record.result)}</span>
                      <span className="result-text">
                        {record.result === 'victory' ? 'Victoire' : 'Défaite'}
                      </span>
                    </td>
                    <td className="units-cell">{formatUnits(record.units_sent)}</td>
                    <td className="losses-cell">{formatUnits(record.units_lost)}</td>
                    <td className="rewards-cell">{formatRewards(record.rewards_earned)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More */}
      {onLoadMore && filteredHistory.length > 0 && (
        <div className="load-more-container">
          <button className="btn-load-more" onClick={onLoadMore}>
            Charger Plus
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="history-summary">
        <div className="summary-stat">
          <span className="summary-label">Total Combats:</span>
          <span className="summary-value">{history.length}</span>
        </div>
        <div className="summary-stat victory">
          <span className="summary-label">Victoires:</span>
          <span className="summary-value">
            {history.filter(r => r.result === 'victory').length}
          </span>
        </div>
        <div className="summary-stat defeat">
          <span className="summary-label">Défaites:</span>
          <span className="summary-value">
            {history.filter(r => r.result === 'defeat').length}
          </span>
        </div>
        <div className="summary-stat ratio">
          <span className="summary-label">Taux de Victoire:</span>
          <span className="summary-value">
            {history.length > 0
              ? ((history.filter(r => r.result === 'victory').length / history.length) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PortalHistoryPanel;
