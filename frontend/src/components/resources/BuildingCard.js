// src/components/resources/BuildingCard.js

import React from 'react';
import './BuildingCard.css';

const BuildingCard = ({ building, isSelected, onClick, loading = false }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

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

  return (
    <button
      type="button"
      className={`terra-building-card ${isSelected ? 'terra-building-selected' : ''}`}
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
          <span className="terra-building-level-badge">NIV. {building.level}</span>
        </div>
      </div>
      <div className="terra-building-info">
        <h3 className="terra-building-name">{building.name}</h3>
        <p className="terra-building-description">
          {building.level === 0 ? 'Non construit' : `Production active`}
        </p>
      </div>
      <div className="terra-building-scanlines"></div>
      <div className="terra-building-glow"></div>
    </button>
  );
};

export default BuildingCard;
