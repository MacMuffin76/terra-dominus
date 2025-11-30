import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import '../styles/FairnessWarning.css';

/**
 * FairnessWarning Component
 * Displays PvP fairness warnings before attacking a player
 */
const FairnessWarning = ({ targetUserId, units = [], distance = 0 }) => {
  const [fairness, setFairness] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    fetchFairness();
  }, [targetUserId]);

  useEffect(() => {
    if (units.length > 0 && distance > 0 && targetUserId) {
      estimateAttackCost();
    }
  }, [units, distance, targetUserId]);

  const fetchFairness = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/pvp/matchmaking/fairness/${targetUserId}`);
      
      if (response.data.success) {
        setFairness(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch fairness:', err);
      setError('Impossible de vérifier l\'équilibre du match');
    } finally {
      setLoading(false);
    }
  };

  const estimateAttackCost = async () => {
    try {
      const response = await axiosInstance.post('/pvp/attack/estimate-cost', {
        targetUserId,
        units: units.map(u => ({ entityId: u.entityId, quantity: u.quantity })),
        distance
      });
      
      if (response.data.success) {
        setCostEstimate(response.data.data);
      }
    } catch (err) {
      console.error('Failed to estimate cost:', err);
    }
  };

  if (loading) {
    return (
      <div className="fairness-warning loading">
        <div className="loading-spinner">⚡</div>
        <span>Analyse de l'équilibre...</span>
      </div>
    );
  }

  if (error || !fairness) {
    return null;
  }

  const getFairnessColor = () => {
    switch (fairness.fairness.fairness) {
      case 'optimal': return '#10b981'; // green
      case 'fair': return '#f59e0b'; // yellow
      case 'unfair': return '#f97316'; // orange
      case 'very_unfair': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getFairnessIcon = () => {
    switch (fairness.fairness.fairness) {
      case 'optimal': return '🟢';
      case 'fair': return '🟡';
      case 'unfair': return '🟠';
      case 'very_unfair': return '🔴';
      default: return '⚪';
    }
  };

  const showWarning = fairness.cost.isWeakTarget || fairness.fairness.fairness === 'very_unfair';

  return (
    <div className={`fairness-warning ${showWarning ? 'warning-active' : ''}`}>
      {/* Fairness Badge */}
      <div className="fairness-badge" style={{ borderColor: getFairnessColor() }}>
        <span className="fairness-icon">{getFairnessIcon()}</span>
        <div className="fairness-info">
          <span className="fairness-label">Équilibre du Match</span>
          <span className="fairness-value" style={{ color: getFairnessColor() }}>
            {fairness.fairness.message}
          </span>
        </div>
      </div>

      {/* Power Comparison */}
      <div className="power-comparison">
        <div className="power-bar-container">
          <div className="power-bar-label">
            <span>Vous</span>
            <span className="power-value">{fairness.attackerPower.toLocaleString()}</span>
          </div>
          <div className="power-bar attacker" style={{ width: '100%' }}></div>
        </div>
        <div className="power-bar-container">
          <div className="power-bar-label">
            <span>Cible</span>
            <span className="power-value">{fairness.defenderPower.toLocaleString()}</span>
          </div>
          <div 
            className="power-bar defender" 
            style={{ 
              width: `${(fairness.defenderPower / fairness.attackerPower) * 100}%`,
              backgroundColor: getFairnessColor()
            }}
          ></div>
        </div>
        <div className="power-difference">
          Différence: {Math.abs(fairness.fairness.powerDifference)}% 
          {fairness.defenderPower < fairness.attackerPower ? ' (plus faible)' : ' (plus fort)'}
        </div>
      </div>

      {/* Cost Warning */}
      {fairness.cost.isWeakTarget && (
        <div className="cost-warning">
          <div className="warning-header">
            <span className="warning-icon">⚠️</span>
            <span className="warning-title">Pénalité d'Attaque sur Cible Faible</span>
          </div>
          <div className="warning-content">
            <p className="warning-message">{fairness.cost.message}</p>
            <div className="penalty-details">
              <div className="penalty-item">
                <span className="penalty-label">Pénalité Gold:</span>
                <span className="penalty-value">+{fairness.cost.goldPenalty.toLocaleString()} 💰</span>
              </div>
              <div className="penalty-item">
                <span className="penalty-label">Coût Carburant:</span>
                <span className="penalty-value">×{fairness.cost.costMultiplier} ⛽</span>
              </div>
              <div className="penalty-item">
                <span className="penalty-label">Récompenses:</span>
                <span className="penalty-value">×{fairness.rewards.rewardMultiplier} 🎁</span>
              </div>
            </div>
            {costEstimate && costEstimate.costs && (
              <div className="cost-breakdown">
                <div className="cost-header">Coût Total Estimé:</div>
                <div className="cost-items">
                  <div className="cost-item">
                    <span>Carburant:</span>
                    <span className="cost-value">
                      <span className="cost-original">{costEstimate.costs.original.fuel}</span>
                      → <span className="cost-penalty">{costEstimate.costs.scaled.fuel}</span>
                    </span>
                  </div>
                  <div className="cost-item">
                    <span>Gold:</span>
                    <span className="cost-value">
                      +{costEstimate.costs.penalty.gold.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reward Info */}
      {!fairness.cost.isWeakTarget && fairness.rewards.rewardMultiplier !== 1.0 && (
        <div className="reward-bonus">
          <span className="bonus-icon">🎁</span>
          <span className="bonus-text">
            {fairness.rewards.message} (×{fairness.rewards.rewardMultiplier})
          </span>
        </div>
      )}
    </div>
  );
};

export default FairnessWarning;
