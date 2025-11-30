/**
 * PortalBattleEstimation Component
 * Display battle power comparison and victory probability
 */

import React from 'react';
import './PortalBattleEstimation.css';

const PortalBattleEstimation = ({ estimation }) => {
  if (!estimation) return null;

  const { player_power, portal_power, power_ratio, verdict, expected_losses } = estimation;

  // Calculate percentage for power bars
  const totalPower = player_power + portal_power;
  const playerPercentage = (player_power / totalPower) * 100;
  const portalPercentage = (portal_power / totalPower) * 100;

  // Determine color based on power ratio
  const getColorClass = () => {
    if (power_ratio >= 1.2) return 'excellent'; // Green
    if (power_ratio >= 0.8) return 'fair'; // Yellow
    return 'poor'; // Red
  };

  const getVerdictIcon = () => {
    if (power_ratio >= 1.2) return '✅';
    if (power_ratio >= 0.8) return '⚠️';
    return '❌';
  };

  const formatLosses = () => {
    if (!expected_losses || typeof expected_losses !== 'object') return 'Aucune perte estimée';
    
    return Object.entries(expected_losses)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ') || 'Pertes minimales';
  };

  return (
    <div className={`battle-estimation ${getColorClass()}`}>
      {/* Power Comparison */}
      <div className="power-comparison">
        <div className="power-header">
          <span className="player-label">Votre Puissance</span>
          <span className="vs">VS</span>
          <span className="portal-label">Puissance du Portail</span>
        </div>

        <div className="power-bars">
          <div 
            className="power-bar player-bar" 
            style={{ width: `${playerPercentage}%` }}
            title={`${player_power.toLocaleString()} (${playerPercentage.toFixed(1)}%)`}
          >
            <span className="power-value">{player_power.toLocaleString()}</span>
          </div>
          <div 
            className="power-bar portal-bar" 
            style={{ width: `${portalPercentage}%` }}
            title={`${portal_power.toLocaleString()} (${portalPercentage.toFixed(1)}%)`}
          >
            <span className="power-value">{portal_power.toLocaleString()}</span>
          </div>
        </div>

        <div className="ratio-display">
          <span className="ratio-label">Ratio de Puissance:</span>
          <span className="ratio-value">{power_ratio.toFixed(2)}x</span>
        </div>
      </div>

      {/* Verdict */}
      <div className="verdict-section">
        <div className="verdict-icon">{getVerdictIcon()}</div>
        <div className="verdict-text">{verdict}</div>
      </div>

      {/* Expected Losses */}
      <div className="losses-section">
        <h4>Pertes Estimées</h4>
        <p className="losses-text">{formatLosses()}</p>
      </div>

      {/* Strategy Advice */}
      <div className="advice-section">
        {power_ratio >= 1.2 && (
          <div className="advice excellent">
            💪 Excellente puissance! Victoire très probable avec pertes minimales.
          </div>
        )}
        {power_ratio >= 0.8 && power_ratio < 1.2 && (
          <div className="advice fair">
            ⚔️ Combat équilibré. Victoire possible mais avec des pertes significatives.
          </div>
        )}
        {power_ratio < 0.8 && (
          <div className="advice poor">
            ⚠️ Puissance insuffisante. Risque élevé de défaite. Renforcez votre armée!
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalBattleEstimation;
