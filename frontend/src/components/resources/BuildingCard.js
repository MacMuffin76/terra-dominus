// src/components/resources/BuildingCard.js

import React, { useState, useEffect } from 'react';
import './BuildingCard.css';

const BuildingCard = ({ building, isSelected, onClick, loading = false, status, constructionEndsAt }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  // Icônes par type de bâtiment
  const getResourceIcon = (name) => {
    if (name.includes('or')) return '💰';
    if (name.includes('métal')) return '⚙️';
    if (name.includes('Extracteur')) return '⛽';
    if (name.includes('électrique')) return '⚡';
    if (name.includes('Hangar')) return '📦';
    if (name.includes('Réservoir')) return '🛢️';
    return '🏗️';
  };

  const Skeleton = () => (
    <div className="terra-building-skeleton"></div>
  );

  if (loading) {
    return (
      <div className="terra-building-card terra-building-loading">
        <Skeleton />
      </div>
    );
  }

  const isBuilt = building.level > 0;
  const icon = getResourceIcon(building.name);
  const isBuilding = status === 'building';

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!isBuilding || !constructionEndsAt) {
      setRemainingSeconds(0);
      return;
    }

    const endTime = new Date(constructionEndsAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingSeconds(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isBuilding, constructionEndsAt]);

  const formatRemaining = (seconds) => {
    if (seconds <= 0) return '--:--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <button
      type="button"
      className={`terra-building-card ${isSelected ? 'terra-building-selected' : ''} ${!isBuilt ? 'terra-building-not-built' : ''}`}
      onClick={() => onClick(building)}
      aria-pressed={isSelected}
      aria-label={`${building.name}, niveau ${building.level}`}
    >
      <div className="terra-building-image-wrapper">
        <img
          src={`/images/buildings/${formatFileName(building.name)}.png`}
          alt={building.name}
          className="terra-building-image"
        />
        <div className="terra-building-overlay">
          <span className="terra-building-level-badge">
            {icon} NIV. {building.level}
          </span>
        </div>
      </div>
      <div className="terra-building-info">
        <h3 className="terra-building-name">{building.name}</h3>
        <p className="terra-building-description">
          {!isBuilt && 'Non construit'}
          {isBuilt && building.capacite > 0 && `Capacité: ${building.capacite.toLocaleString()}`}
          {isBuilt && building.capacite === 0 && 'Production active'}
        </p>
      </div>
      {!isBuilt && (
        <div className="terra-building-not-built-badge">
          À construire
        </div>
      )}
      {isBuilding && (
        <div className="terra-building-construction-badge">
          🏗️ {formatRemaining(remainingSeconds)}
        </div>
      )}
      <div className="terra-building-scanlines"></div>
      <div className="terra-building-glow"></div>
    </button>
  );
};

export default BuildingCard;
