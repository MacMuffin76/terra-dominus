// src/components/training/TrainingCard.js

import React from 'react';
import './TrainingCard.css';

const TrainingCard = ({ training, isSelected, onClick, loading = false }) => {
  const formatFileName = (name) =>
    (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  const Skeleton = () => (
    <div className="terra-training-skeleton"></div>
  );

  if (loading) {
    return (
      <div className="terra-training-card terra-training-loading">
        <Skeleton />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`terra-training-card ${isSelected ? 'terra-training-selected' : ''}`}
      onClick={() => onClick(training)}
      aria-pressed={isSelected}
      aria-label={`${training.name}, niveau ${training.level ?? 0}`}
    >
      <div className="terra-training-image-wrapper">
        <img
          src={`/images/training/${formatFileName(training.name)}.png`}
          alt={training.name}
          className="terra-training-image"
        />
        <div className="terra-training-overlay">
          <span className="terra-training-level-badge">NIV. {training.level ?? 0}</span>
        </div>
      </div>
      <div className="terra-training-info">
        <h3 className="terra-training-name">{training.name}</h3>
        <p className="terra-training-description">
          {training.level === 0 ? 'Non construit' : `Centre actif`}
        </p>
      </div>
      <div className="terra-training-scanlines"></div>
      <div className="terra-training-glow"></div>
    </button>
  );
};

export default TrainingCard;
