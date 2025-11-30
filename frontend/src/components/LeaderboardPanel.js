import React, { useState, useEffect } from 'react';
import {
  getLeaderboard,
  getMyPosition,
  LEADERBOARD_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS
} from '../api/leaderboard';
import './LeaderboardPanel.css';

const LeaderboardPanel = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(LEADERBOARD_CATEGORIES.TOTAL_POWER);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger le leaderboard
      const data = await getLeaderboard(selectedCategory, 100, 0);
      setLeaderboardData(data);

      // Charger la position de l'utilisateur
      try {
        const position = await getMyPosition(selectedCategory);
        setMyPosition(position);
      } catch (err) {
        // L'utilisateur n'est peut-être pas dans ce leaderboard
        setMyPosition(null);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    if (rank <= 10) return 'rank-top10';
    if (rank <= 50) return 'rank-top50';
    return 'rank-normal';
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankChangeIcon = (rankChange) => {
    if (rankChange > 0) return <span className="rank-up">▲ +{rankChange}</span>;
    if (rankChange < 0) return <span className="rank-down">▼ {rankChange}</span>;
    return <span className="rank-same">-</span>;
  };

  const formatScore = (score) => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(2)}M`;
    }
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="leaderboard-header">
          <h2>🏆 Classements</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Category selector */}
        <div className="category-selector">
          {Object.entries(LEADERBOARD_CATEGORIES).map(([key, value]) => (
            <button
              key={value}
              className={`category-button ${selectedCategory === value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(value)}
              title={CATEGORY_LABELS[value]}
            >
              <span className="category-icon">{CATEGORY_ICONS[value]}</span>
              <span className="category-label">{CATEGORY_LABELS[value]}</span>
            </button>
          ))}
        </div>

        {/* User position banner (if available) */}
        {myPosition && (
          <div className="my-position-banner">
            <div className="my-position-content">
              <span className="my-rank">Votre position: #{myPosition.rank}</span>
              <span className="my-score">Score: {formatScore(myPosition.score)}</span>
              {myPosition.rank_change !== 0 && (
                <span className="my-rank-change">
                  {getRankChangeIcon(myPosition.rank_change)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement du classement...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadLeaderboard}>Réessayer</button>
          </div>
        )}

        {/* Leaderboard table */}
        {!loading && !error && leaderboardData && (
          <div className="leaderboard-content">
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th className="col-rank">Rang</th>
                    <th className="col-user">Joueur</th>
                    <th className="col-score">Score</th>
                    <th className="col-change">Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.entries.map((entry) => (
                    <tr
                      key={entry.user.id}
                      className={`
                        leaderboard-row 
                        ${getRankClass(entry.rank)}
                        ${myPosition && entry.user.id === myPosition.user.id ? 'my-entry' : ''}
                      `}
                    >
                      <td className="col-rank">
                        <div className="rank-display">
                          {getRankMedal(entry.rank)}
                          <span className="rank-number">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="col-user">
                        <div className="user-display">
                          <span className="username">{entry.user.username}</span>
                          {myPosition && entry.user.id === myPosition.user.id && (
                            <span className="you-badge">Vous</span>
                          )}
                        </div>
                      </td>
                      <td className="col-score">
                        <span className="score-value">{formatScore(entry.score)}</span>
                      </td>
                      <td className="col-change">
                        {getRankChangeIcon(entry.rank_change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {leaderboardData.entries.length === 0 && (
              <div className="empty-state">
                <p>Aucune donnée disponible pour ce classement</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPanel;
