// src/components/defense/DefenseCard.js

import React from 'react';
import './DefenseCard.css';

const DefenseCard = ({ defense, isSelected, onClick, loading = false }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const Skeleton = () => (
    <div className="terra-defense-skeleton"></div>
  );

  if (loading) {
    return (
      <div className="terra-defense-card terra-defense-loading">
        <Skeleton />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`terra-defense-card ${isSelected ? 'terra-defense-selected' : ''}`}
      onClick={() => onClick(defense)}
      aria-pressed={isSelected}
      aria-label={`${defense.name}, quantité ${defense.quantity}`}
    >
      <div className="terra-defense-image-wrapper">
        <img
          src={`/images/defense/${formatFileName(defense.name)}.png`}
          alt={defense.name}
          className="terra-defense-image"
        />
        <div className="terra-defense-overlay">
          <span className="terra-defense-quantity-badge">
            {defense.quantity > 0 ? `×${defense.quantity}` : 'Aucune'}
          </span>
        </div>
      </div>
      <div className="terra-defense-info">
        <h3 className="terra-defense-name">{defense.name}</h3>
        <p className="terra-defense-description">
          {defense.quantity === 0 ? 'Non déployée' : `Défense active`}
        </p>
      </div>
      <div className="terra-defense-scanlines"></div>
      <div className="terra-defense-glow"></div>
    </button>
  );
};

export default DefenseCard;
