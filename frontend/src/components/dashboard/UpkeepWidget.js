// frontend/src/components/dashboard/UpkeepWidget.js

import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { getUpkeepReport } from '../../api/unitUnlocks';
import './UpkeepWidget.css';

/**
 * Dashboard widget showing upkeep costs and warnings
 */
const UpkeepWidget = () => {
  const [upkeepData, setUpkeepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUpkeep();
    // Refresh every 5 minutes
    const interval = setInterval(loadUpkeep, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadUpkeep = async () => {
    try {
      const data = await getUpkeepReport();
      setUpkeepData(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="upkeep-widget">
        <div className="widget-header">
          <h3>💰 Entretien des Unités</h3>
        </div>
        <div className="widget-loading">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upkeep-widget error">
        <div className="widget-header">
          <h3>💰 Entretien des Unités</h3>
        </div>
        <div className="widget-error">{error}</div>
      </div>
    );
  }

  if (!upkeepData || !upkeepData.upkeep) {
    return (
      <div className="upkeep-widget">
        <div className="widget-header">
          <h3>💰 Entretien des Unités</h3>
        </div>
        <div className="no-upkeep">
          <CheckCircle size={32} />
          <p>Aucune unité à entretenir</p>
        </div>
      </div>
    );
  }

  const { upkeep = {}, income = {}, net = {}, warnings = [] } = upkeepData;
  const hasWarnings = warnings && warnings.length > 0;
  const isDeficit = (net.gold || 0) < 0 || (net.metal || 0) < 0 || (net.fuel || 0) < 0;

  // Calculate percentage of income consumed by upkeep
  const goldPercent = (income.gold || 0) > 0 ? Math.round(((upkeep.gold || 0) / income.gold) * 100) : 0;
  const metalPercent = (income.metal || 0) > 0 ? Math.round(((upkeep.metal || 0) / income.metal) * 100) : 0;
  const fuelPercent = (income.fuel || 0) > 0 ? Math.round(((upkeep.fuel || 0) / income.fuel) * 100) : 0;

  const getStatusColor = (percent) => {
    if (percent >= 80) return '#ff4444'; // Critical
    if (percent >= 60) return '#ff9800'; // Warning
    return '#4caf50'; // OK
  };

  return (
    <div className={`upkeep-widget ${hasWarnings ? 'has-warnings' : ''}`}>
      <div className="widget-header">
        <h3>💰 Entretien des Unités</h3>
        {hasWarnings && (
          <span className="warning-badge">
            <AlertTriangle size={16} />
            {warnings.length}
          </span>
        )}
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="warnings-section">
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning-item">
              <AlertTriangle size={16} />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upkeep Summary */}
      <div className="upkeep-summary">
        {/* Gold */}
        <div className="resource-row">
          <div className="resource-label">
            <span className="resource-icon gold">🪙</span>
            <span>Or</span>
          </div>
          <div className="resource-values">
            <div className="value income">
              <TrendingUp size={14} />
              <span>+{income.gold}/h</span>
            </div>
            <div className="value upkeep">
              <TrendingDown size={14} />
              <span>-{upkeep.gold}/h</span>
            </div>
            <div className={`value net ${net.gold < 0 ? 'negative' : 'positive'}`}>
              <span>{net.gold >= 0 ? '+' : ''}{net.gold}/h</span>
            </div>
          </div>
          <div className="resource-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${Math.min(goldPercent, 100)}%`,
                background: getStatusColor(goldPercent)
              }}
            />
          </div>
          <span className="percent" style={{ color: getStatusColor(goldPercent) }}>
            {goldPercent}%
          </span>
        </div>

        {/* Metal */}
        <div className="resource-row">
          <div className="resource-label">
            <span className="resource-icon metal">⚙️</span>
            <span>Métal</span>
          </div>
          <div className="resource-values">
            <div className="value income">
              <TrendingUp size={14} />
              <span>+{income.metal}/h</span>
            </div>
            <div className="value upkeep">
              <TrendingDown size={14} />
              <span>-{upkeep.metal}/h</span>
            </div>
            <div className={`value net ${net.metal < 0 ? 'negative' : 'positive'}`}>
              <span>{net.metal >= 0 ? '+' : ''}{net.metal}/h</span>
            </div>
          </div>
          <div className="resource-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${Math.min(metalPercent, 100)}%`,
                background: getStatusColor(metalPercent)
              }}
            />
          </div>
          <span className="percent" style={{ color: getStatusColor(metalPercent) }}>
            {metalPercent}%
          </span>
        </div>

        {/* Fuel */}
        <div className="resource-row">
          <div className="resource-label">
            <span className="resource-icon fuel">⛽</span>
            <span>Carburant</span>
          </div>
          <div className="resource-values">
            <div className="value income">
              <TrendingUp size={14} />
              <span>+{income.fuel}/h</span>
            </div>
            <div className="value upkeep">
              <TrendingDown size={14} />
              <span>-{upkeep.fuel}/h</span>
            </div>
            <div className={`value net ${net.fuel < 0 ? 'negative' : 'positive'}`}>
              <span>{net.fuel >= 0 ? '+' : ''}{net.fuel}/h</span>
            </div>
          </div>
          <div className="resource-bar">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${Math.min(fuelPercent, 100)}%`,
                background: getStatusColor(fuelPercent)
              }}
            />
          </div>
          <span className="percent" style={{ color: getStatusColor(fuelPercent) }}>
            {fuelPercent}%
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className={`status-message ${isDeficit ? 'deficit' : 'surplus'}`}>
        {isDeficit ? (
          <>
            <AlertTriangle size={16} />
            <span>⚠️ Production insuffisante - Unités en danger</span>
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            <span>✅ Économie stable</span>
          </>
        )}
      </div>

      {/* Tip */}
      {goldPercent > 60 && (
        <div className="upkeep-tip">
          💡 <strong>Astuce:</strong> L'entretien consomme {goldPercent}% de votre production. Augmentez vos mines ou réduisez votre armée.
        </div>
      )}
    </div>
  );
};

export default UpkeepWidget;
