// src/components/research/ResearchCard.js

import React from 'react';
import './ResearchCard.css';

const ResearchCard = ({ research, isSelected, onClick, loading = false }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  const Skeleton = () => (
    <div className="terra-research-skeleton"></div>
  );

  if (loading) {
    return (
      <div className="terra-research-card terra-research-loading">
        <Skeleton />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`terra-research-card ${isSelected ? 'terra-research-selected' : ''}`}
      onClick={() => onClick(research)}
      aria-pressed={isSelected}
      aria-label={`${research.name}, niveau ${research.level}`}
    >
      <div className="terra-research-image-wrapper">
        <img
          src={`/images/research/${formatFileName(research.name)}.png`}
          alt={research.name}
          className="terra-research-image"
        />
        <div className="terra-research-overlay">
          <span className="terra-research-level-badge">NIV. {research.level}</span>
        </div>
      </div>
      <div className="terra-research-info">
        <h3 className="terra-research-name">{research.name}</h3>
        <p className="terra-research-description">
          {research.level === 0 ? 'Non recherché' : `Technologie active`}
        </p>
      </div>
      <div className="terra-research-scanlines"></div>
      <div className="terra-research-glow"></div>
    </button>
  );
};

export default ResearchCard;
