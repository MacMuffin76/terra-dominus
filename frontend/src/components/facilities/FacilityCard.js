// src/components/facilities/FacilityCard.js

import React from 'react';
import './FacilityCard.css';

const FacilityCard = ({ facility, isSelected, onClick, loading = false }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  const Skeleton = () => (
    <div className="terra-facility-skeleton"></div>
  );

  if (loading) {
    return (
      <div className="terra-facility-card terra-facility-loading">
        <Skeleton />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`terra-facility-card ${isSelected ? 'terra-facility-selected' : ''}`}
      onClick={() => onClick(facility)}
      aria-pressed={isSelected}
      aria-label={`${facility.name}, niveau ${facility.level}`}
    >
      <div className="terra-facility-image-wrapper">
        <img
          src={`/images/facilities/${formatFileName(facility.name)}.png`}
          alt={facility.name}
          className="terra-facility-image"
        />
        <div className="terra-facility-overlay">
          <span className="terra-facility-level-badge">NIV. {facility.level}</span>
        </div>
      </div>
      <div className="terra-facility-info">
        <h3 className="terra-facility-name">{facility.name}</h3>
        <p className="terra-facility-description">
          {facility.level === 0 ? 'Non construit' : `Niveau ${facility.level} actif`}
        </p>
      </div>
      <div className="terra-facility-scanlines"></div>
      <div className="terra-facility-glow"></div>
    </button>
  );
};

export default FacilityCard;
