/**
 * PortalMarker Component
 * Affiche un portail sur la WorldMap
 */

import React from 'react';
import './PortalMarker.css';

const TIER_COLORS = {
  GREY: '#808080',
  GREEN: '#00FF00',
  BLUE: '#0099FF',
  PURPLE: '#9933FF',
  RED: '#FF0000',
  GOLD: '#FFD700'
};

const TIER_SIZES = {
  GREY: 6,
  GREEN: 7,
  BLUE: 8,
  PURPLE: 9,
  RED: 10,
  GOLD: 12
};

const PortalMarker = ({ portal, x, y, cellSize, isSelected, onClick }) => {
  const color = TIER_COLORS[portal.tier] || '#808080';
  const size = TIER_SIZES[portal.tier] || 6;
  
  const centerX = x + cellSize / 2;
  const centerY = y + cellSize / 2;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick && onClick(portal);
  };

  return (
    <div
      className={`portal-marker portal-tier-${portal.tier.toLowerCase()} ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: centerX - size,
        top: centerY - size,
        width: size * 2,
        height: size * 2,
        borderRadius: '50%',
        backgroundColor: color,
        border: `2px solid ${isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}`,
        boxShadow: `0 0 ${size}px ${color}`,
        cursor: 'pointer',
        zIndex: 100,
        animation: 'portal-pulse 2s infinite'
      }}
      onClick={handleClick}
      title={`${portal.tier} Portal - Power: ${portal.power}`}
    />
  );
};

export default PortalMarker;
