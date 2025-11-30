/**
 * PortalMasteryPanel Component
 * Display user's portal mastery progression across all tiers
 */

import React from 'react';
import './PortalMasteryPanel.css';

const TIER_CONFIG = {
  grey: { name: 'Gris', rank: 'E', color: '#808080', glow: 'rgba(128, 128, 128, 0.4)' },
  green: { name: 'Vert', rank: 'D', color: '#00FF00', glow: 'rgba(0, 255, 0, 0.4)' },
  blue: { name: 'Bleu', rank: 'C', color: '#0099FF', glow: 'rgba(0, 153, 255, 0.4)' },
  purple: { name: 'Violet', rank: 'B', color: '#9933FF', glow: 'rgba(153, 51, 255, 0.4)' },
  red: { name: 'Rouge', rank: 'A', color: '#FF0000', glow: 'rgba(255, 0, 0, 0.4)' },
  golden: { name: 'Doré', rank: 'S', color: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' }
};

const MASTERY_LEVELS = {
  0: { name: 'Novice', clears: 0, icon: '🔒', color: '#666' },
  1: { name: 'Apprenti', clears: 10, icon: '🥉', color: '#CD7F32' },
  2: { name: 'Adepte', clears: 25, icon: '🥈', color: '#C0C0C0' },
  3: { name: 'Expert', clears: 50, icon: '🥇', color: '#FFD700' },
  4: { name: 'Maître', clears: 100, icon: '👑', color: '#FF69B4' }
};

const PortalMasteryPanel = ({ mastery, onRefresh }) => {
  if (!mastery || mastery.length === 0) {
    return (
      <div className="mastery-empty">
        <p>Aucune maîtrise des portails pour le moment.</p>
        <p>Complétez des portails pour débloquer des bonus!</p>
      </div>
    );
  }

  const getMasteryForTier = (tier) => {
    return mastery.find(m => m.tier === tier) || {
      tier,
      mastery_level: 0,
      total_clears: 0,
      reward_bonus: 0,
      cost_reduction: 0,
      fastest_clear_time: null
    };
  };

  const getProgressToNextLevel = (totalClears, currentLevel) => {
    if (currentLevel >= 4) return 100; // Max level
    const nextLevel = MASTERY_LEVELS[currentLevel + 1];
    const currentThreshold = MASTERY_LEVELS[currentLevel].clears;
    const nextThreshold = nextLevel.clears;
    
    const progress = ((totalClears - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="portal-mastery-panel">
      <div className="mastery-header">
        <h3>Maîtrise des Portails</h3>
        <button className="btn-refresh" onClick={onRefresh}>
          🔄 Actualiser
        </button>
      </div>

      <div className="mastery-grid">
        {Object.entries(TIER_CONFIG).map(([tier, config]) => {
          const tierMastery = getMasteryForTier(tier);
          const masteryLevelInfo = MASTERY_LEVELS[tierMastery.mastery_level];
          const progress = getProgressToNextLevel(tierMastery.total_clears, tierMastery.mastery_level);
          const isMaxLevel = tierMastery.mastery_level >= 4;

          return (
            <div 
              key={tier}
              className={`mastery-card tier-${tier}`}
              style={{ 
                borderColor: config.color,
                boxShadow: `0 0 15px ${config.glow}`
              }}
            >
              <div className="mastery-card-header" style={{ background: config.color }}>
                <span className="tier-rank">{config.rank}</span>
                <span className="tier-name">{config.name}</span>
              </div>

              <div className="mastery-card-body">
                {/* Mastery Level */}
                <div className="mastery-level-section">
                  <span className="mastery-icon" style={{ color: masteryLevelInfo.color }}>
                    {masteryLevelInfo.icon}
                  </span>
                  <div className="mastery-level-info">
                    <span className="level-name" style={{ color: masteryLevelInfo.color }}>
                      {masteryLevelInfo.name}
                    </span>
                    <span className="level-number">Niveau {tierMastery.mastery_level}/4</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {!isMaxLevel && (
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${progress}%`,
                          background: config.color
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {tierMastery.total_clears} / {MASTERY_LEVELS[tierMastery.mastery_level + 1]?.clears || '∞'}
                    </span>
                  </div>
                )}

                {isMaxLevel && (
                  <div className="max-level-badge">
                    ⭐ NIVEAU MAXIMUM ⭐
                  </div>
                )}

                {/* Stats */}
                <div className="mastery-stats">
                  <div className="stat-item">
                    <span className="stat-label">Victoires:</span>
                    <span className="stat-value">{tierMastery.total_clears}</span>
                  </div>

                  {tierMastery.mastery_level > 0 && (
                    <>
                      <div className="stat-item">
                        <span className="stat-label">Bonus Récompenses:</span>
                        <span className="stat-value bonus">+{tierMastery.reward_bonus}%</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Réduction Coût:</span>
                        <span className="stat-value bonus">-{tierMastery.cost_reduction}%</span>
                      </div>
                    </>
                  )}

                  {tierMastery.fastest_clear_time && (
                    <div className="stat-item">
                      <span className="stat-label">Record:</span>
                      <span className="stat-value record">
                        ⏱️ {formatTime(tierMastery.fastest_clear_time)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalMasteryPanel;
