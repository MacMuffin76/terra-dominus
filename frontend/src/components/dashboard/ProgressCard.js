// src/components/dashboard/ProgressCard.js

import React from 'react';
import './ProgressCard.css';

const ProgressCard = ({ title, items, icon, emptyMessage = 'Aucun élément' }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  if (!items || items.length === 0) {
    return (
      <div className="terra-progress-card">
        <div className="terra-progress-header">
          {icon && <span className="terra-progress-icon">{icon}</span>}
          <h3 className="terra-progress-title">{title}</h3>
        </div>
        <div className="terra-progress-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terra-progress-card">
      <div className="terra-progress-header">
        {icon && <span className="terra-progress-icon">{icon}</span>}
        <h3 className="terra-progress-title">{title}</h3>
        <span className="terra-progress-count">{items.length}</span>
      </div>
      <div className="terra-progress-list">
        {items.map((item, index) => (
          <div key={item.id || index} className="terra-progress-item">
            <div className="terra-progress-item-icon">
              <img
                src={item.image}
                alt={item.name}
                className="terra-progress-img"
              />
            </div>
            <div className="terra-progress-item-details">
              <span className="terra-progress-item-name">{item.name}</span>
              <span className="terra-progress-item-info">
                {item.level && `Niveau ${item.level}`}
                {item.quantity && `Quantité: ${item.quantity}`}
              </span>
            </div>
            {item.status && (
              <span className={`terra-badge terra-badge-${item.status}`}>
                {item.status}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="terra-progress-scanlines"></div>
    </div>
  );
};

export default ProgressCard;
