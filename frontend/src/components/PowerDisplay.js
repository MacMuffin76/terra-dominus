import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import '../styles/PowerDisplay.css';

/**
 * PowerDisplay Component
 * Displays player's PvP power score with detailed breakdown
 */
const PowerDisplay = ({ userId, inline = false }) => {
  const [power, setPower] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPower();
    // Refresh power every 5 minutes (cache TTL)
    const interval = setInterval(fetchPower, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchPower = async () => {
    try {
      setLoading(true);
      const endpoint = userId ? `/pvp/power/${userId}` : '/pvp/power/me';
      const response = await axiosInstance.get(endpoint);
      
      if (response.data.success) {
        setPower(response.data.data.power);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch power:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdown = async () => {
    if (breakdown) {
      setShowBreakdown(!showBreakdown);
      return;
    }

    try {
      const response = await axiosInstance.get('/pvp/power/me/breakdown');
      if (response.data.success) {
        setBreakdown(response.data.data);
        setShowBreakdown(true);
      }
    } catch (err) {
      console.error('Failed to fetch breakdown:', err);
    }
  };

  if (loading && !power) {
    return (
      <div className={`power-display ${inline ? 'inline' : ''} loading`}>
        <span className="power-icon">⚡</span>
        <span className="power-value">...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`power-display ${inline ? 'inline' : ''} error`}>
        <span className="power-icon">⚡</span>
        <span className="power-value">???</span>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`power-display ${inline ? 'inline' : ''}`}
        onClick={() => !userId && fetchBreakdown()}
        style={{ cursor: userId ? 'default' : 'pointer' }}
        title={userId ? `Puissance: ${power?.toLocaleString()}` : 'Cliquer pour détails'}
      >
        <span className="power-icon">⚡</span>
        <span className="power-value">{power?.toLocaleString() || '0'}</span>
        <span className="power-label">Puissance</span>
        {!userId && <span className="power-expand-icon">▼</span>}
      </div>

      {showBreakdown && breakdown && (
        <div className="power-breakdown-modal" onClick={() => setShowBreakdown(false)}>
          <div className="power-breakdown-content" onClick={(e) => e.stopPropagation()}>
            <div className="power-breakdown-header">
              <h3>⚡ Analyse de Puissance</h3>
              <button 
                className="power-breakdown-close"
                onClick={() => setShowBreakdown(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="power-breakdown-total">
              <span className="breakdown-label">Puissance Totale</span>
              <span className="breakdown-value">{breakdown.totalPower.toLocaleString()}</span>
            </div>

            <div className="power-breakdown-categories">
              {/* Cities */}
              <div className="breakdown-category">
                <div className="category-header">
                  <span className="category-icon">🏛️</span>
                  <span className="category-name">Villes</span>
                  <span className="category-value">{breakdown.breakdown.cities.power.toLocaleString()}</span>
                  <span className="category-percentage">{breakdown.breakdown.cities.percentage}%</span>
                </div>
                <div className="category-details">
                  <span>{breakdown.breakdown.cities.count} ville(s)</span>
                  <span className="detail-value">1000 pts/ville</span>
                </div>
              </div>

              {/* Buildings */}
              <div className="breakdown-category">
                <div className="category-header">
                  <span className="category-icon">🏗️</span>
                  <span className="category-name">Bâtiments</span>
                  <span className="category-value">{breakdown.breakdown.buildings.power.toLocaleString()}</span>
                  <span className="category-percentage">{breakdown.breakdown.buildings.percentage}%</span>
                </div>
                <div className="category-details">
                  <span>Niveaux cumulés</span>
                  <span className="detail-value">50-150 pts/niveau</span>
                </div>
              </div>

              {/* Units */}
              <div className="breakdown-category">
                <div className="category-header">
                  <span className="category-icon">⚔️</span>
                  <span className="category-name">Unités</span>
                  <span className="category-value">{breakdown.breakdown.units.power.toLocaleString()}</span>
                  <span className="category-percentage">{breakdown.breakdown.units.percentage}%</span>
                </div>
                <div className="category-details">
                  <span>{breakdown.breakdown.units.count} unité(s)</span>
                  <span className="detail-value">10-150 pts/unité</span>
                </div>
                {breakdown.breakdown.units.breakdown && Object.keys(breakdown.breakdown.units.breakdown).length > 0 && (
                  <div className="unit-breakdown">
                    {Object.entries(breakdown.breakdown.units.breakdown).map(([unitName, data]) => (
                      <div key={unitName} className="unit-item">
                        <span className="unit-name">{unitName}</span>
                        <span className="unit-quantity">{data.quantity}×</span>
                        <span className="unit-power">{data.power.toLocaleString()} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources */}
              <div className="breakdown-category">
                <div className="category-header">
                  <span className="category-icon">💰</span>
                  <span className="category-name">Ressources</span>
                  <span className="category-value">{breakdown.breakdown.resources.power.toLocaleString()}</span>
                  <span className="category-percentage">{breakdown.breakdown.resources.percentage}%</span>
                </div>
                <div className="category-details">
                  <span>Réserves économiques</span>
                  <span className="detail-value">0.02-0.05 pts/unité</span>
                </div>
              </div>
            </div>

            <div className="power-breakdown-footer">
              <p className="breakdown-info">
                ℹ️ La puissance est mise à jour toutes les 5 minutes. 
                Elle détermine les pénalités PvP lors des attaques.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PowerDisplay;
