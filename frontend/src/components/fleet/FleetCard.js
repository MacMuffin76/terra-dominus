// frontend/src/components/fleet/FleetCard.js

import React from 'react';
import './FleetCard.css';

const formatFileName = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/['']/g, '') // remove apostrophes
    .replace(/\s+/g, '_'); // spaces to underscores

const FleetCard = ({ unit, loading }) => {
  if (loading) {
    return <div className="terra-fleet-skeleton" />;
  }

  return (
    <div className="terra-fleet-card">
      <div className="terra-fleet-image-wrapper">
        <img
          src={`/images/training/${formatFileName(unit.name)}.png`}
          alt={unit.name}
          className="terra-fleet-image"
        />
        <div className="terra-fleet-overlay">
          <span className="terra-fleet-quantity-badge">QTÉ: {unit.quantity}</span>
        </div>
      </div>
      <div className="terra-fleet-info">
        <h3 className="terra-fleet-name">{unit.name}</h3>
        <p className="terra-fleet-description">
          {unit.quantity === 0 ? 'Aucune unité disponible' : `${unit.quantity} unité${unit.quantity > 1 ? 's' : ''} prête${unit.quantity > 1 ? 's' : ''}`}
        </p>
      </div>
      <div className="terra-fleet-scanlines" />
      <div className="terra-fleet-glow" />
    </div>
  );
};

export default FleetCard;
