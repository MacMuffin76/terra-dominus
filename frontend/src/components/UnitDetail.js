// frontend/src/components/UnitDetail.js

import React from 'react';
import './UnitDetail.css';

const formatNumber = (value) =>
  new Intl.NumberFormat('fr-FR').format(Number(value || 0));

const UnitDetail = ({ unit, onClose }) => {
  if (!unit) return null;

  const fileName = unit.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_');

  return (
    <div className="unit-detail-overlay">
      <div className="unit-detail-panel">
        <div
          className="unit-detail-bg"
          style={{
            backgroundImage: `url(/images/training/${fileName}.png)`,
          }}
        >
          <div className="unit-detail-bg-overlay" />
        </div>

        <div className="unit-detail-content">
          <div className="unit-detail-header">
            <div>
              <h2 className="unit-detail-title">{unit.name}</h2>
              <div className="unit-detail-subtitle">UNITÉ</div>
            </div>
          </div>

          <div className="unit-detail-stats">
            <div className="unit-detail-stat">
              <h4>Quantité actuelle</h4>
              <p className="unit-detail-stat-value">
                {formatNumber(unit.quantity)}
              </p>
            </div>

            <div className="unit-detail-stat">
              <h4>Puissance (force)</h4>
              <p className="unit-detail-stat-value">
                {formatNumber(unit.force ?? 0)}
              </p>
            </div>

            <div className="unit-detail-stat">
              <h4>Capacité spéciale</h4>
              <p className="unit-detail-stat-value unit-detail-special">
                {unit.capacite_speciale
                  ? unit.capacite_speciale
                  : 'Aucune capacité spéciale définie'}
              </p>
            </div>
          </div>

          <div className="unit-detail-footer">
            <button type="button" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetail;
