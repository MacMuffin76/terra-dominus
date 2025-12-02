// src/components/dashboard/ResourcesWidget.js

import React from 'react';
import './ResourcesWidget.css';

const ResourcesWidget = ({ resources }) => {
  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(Math.floor(num));
  };

  // Ordre fixe : metal, or, carburant, energie
  const resourceOrder = ['metal', 'or', 'carburant', 'energie'];
  const sortedResources = [...resources].sort((a, b) => {
    const indexA = resourceOrder.indexOf(a.type);
    const indexB = resourceOrder.indexOf(b.type);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="terra-resources-widget">
      {sortedResources.map((resource) => {
        const amount = Math.floor(Number(resource.amount) || 0);
        const storageCapacity = Number(resource.storage_capacity) || 0;
        const production = Number(resource.production) || 0;
        const displayName = resource.type.charAt(0).toUpperCase() + resource.type.slice(1);
        
        // Vérifier si la ressource est au plafond (> 95%)
        const isFull = storageCapacity > 0 && (amount / storageCapacity) >= 0.95;
        const isAtMax = storageCapacity > 0 && amount >= storageCapacity;

        return (
          <div key={resource.type} className={`terra-resource-item ${isFull ? 'full-warning' : ''} ${isAtMax ? 'at-max' : ''}`}>
            <div className="terra-resource-icon-wrapper">
              <img
                src={`./images/resources/${formatFileName(resource.type)}.png`}
                alt={displayName}
                className="terra-resource-icon"
              />
            </div>
            <div className="terra-resource-details">
              <span className="terra-resource-name">{displayName}</span>
              <span className="terra-resource-amount">
                {formatNumber(amount)}
                {storageCapacity > 0 && (
                  <span className="terra-resource-capacity"> / {formatNumber(storageCapacity)}</span>
                )}
                {isAtMax && <span className="max-indicator"> ⚠️ PLEIN</span>}
              </span>
              {production !== 0 && (
                <span className={`terra-resource-production ${production > 0 ? 'positive' : 'negative'}`}>
                  {production > 0 ? '+' : ''}{formatNumber(production)}/h
                  {isFull && production > 0 && <span className="warning-text"> (perte)</span>}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResourcesWidget;
