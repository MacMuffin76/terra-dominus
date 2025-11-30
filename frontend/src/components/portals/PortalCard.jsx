/**
 * PortalCard Component
 * Display a portal in the grid with key information
 */

import React from 'react';
import './PortalCard.css';

const TIER_CONFIG = {
  grey: { name: 'Gris', rank: 'E', color: '#808080', glow: 'rgba(128, 128, 128, 0.4)' },
  green: { name: 'Vert', rank: 'D', color: '#00FF00', glow: 'rgba(0, 255, 0, 0.4)' },
  blue: { name: 'Bleu', rank: 'C', color: '#0099FF', glow: 'rgba(0, 153, 255, 0.4)' },
  purple: { name: 'Violet', rank: 'B', color: '#9933FF', glow: 'rgba(153, 51, 255, 0.4)' },
  red: { name: 'Rouge', rank: 'A', color: '#FF0000', glow: 'rgba(255, 0, 0, 0.4)' },
  golden: { name: 'Doré', rank: 'S', color: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' }
};

const PortalCard = ({ portal, onClick, formatTimeRemaining }) => {
  const tierConfig = TIER_CONFIG[portal.tier] || TIER_CONFIG.grey;
  const timeRemaining = formatTimeRemaining(portal.expiry_time);
  const isExpiringSoon = new Date(portal.expiry_time) - new Date() < 3600000; // < 1 hour

  return (
    <div 
      className={`portal-card portal-tier-${portal.tier} ${isExpiringSoon ? 'expiring-soon' : ''}`}
      onClick={onClick}
      style={{ 
        borderColor: tierConfig.color,
        boxShadow: `0 0 20px ${tierConfig.glow}`
      }}
    >
      <div className="portal-card-header" style={{ background: tierConfig.color }}>
        <span className="portal-rank">{tierConfig.rank}</span>
        <span className="portal-tier-name">{tierConfig.name}</span>
      </div>

      <div className="portal-card-body">
        <div className="portal-info-row">
          <span className="info-label">Difficulté</span>
          <span className="info-value">
            <span className="difficulty-stars">
              {'⭐'.repeat(Math.min(portal.difficulty, 10))}
            </span>
            <span className="difficulty-num">{portal.difficulty}/10</span>
          </span>
        </div>

        <div className="portal-info-row">
          <span className="info-label">Puissance</span>
          <span className="info-value power-value">
            {portal.recommended_power.toLocaleString()}
          </span>
        </div>

        <div className="portal-info-row">
          <span className="info-label">Position</span>
          <span className="info-value">
            ({portal.x_coordinate}, {portal.y_coordinate})
          </span>
        </div>

        <div className="portal-info-row">
          <span className="info-label">Expire dans</span>
          <span className={`info-value time-remaining ${isExpiringSoon ? 'urgent' : ''}`}>
            {timeRemaining}
          </span>
        </div>

        {portal.global_event && (
          <div className="global-event-badge">
            🏆 ÉVÉNEMENT MONDIAL
          </div>
        )}
      </div>

      <div className="portal-card-footer">
        <button 
          className="btn-attack"
          style={{ 
            background: tierConfig.color,
            boxShadow: `0 0 10px ${tierConfig.glow}`
          }}
        >
          Attaquer →
        </button>
      </div>

      {portal.tier === 'golden' && (
        <div className="golden-animation"></div>
      )}
    </div>
  );
};

export default PortalCard;
