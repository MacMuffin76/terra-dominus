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

  return (
    <div className="terra-resources-widget">
      {resources.map((resource) => {
        const amount = Math.floor(Number(resource.amount) || 0);
        const production = Number(resource.production) || 0;
        const displayName = resource.type.charAt(0).toUpperCase() + resource.type.slice(1);

        return (
          <div key={resource.type} className="terra-resource-item">
            <div className="terra-resource-icon-wrapper">
              <img
                src={`./images/resources/${formatFileName(resource.type)}.png`}
                alt={displayName}
                className="terra-resource-icon"
              />
            </div>
            <div className="terra-resource-details">
              <span className="terra-resource-name">{displayName}</span>
              <span className="terra-resource-amount">{formatNumber(amount)}</span>
              {production !== 0 && (
                <span className={`terra-resource-production ${production > 0 ? 'positive' : 'negative'}`}>
                  {production > 0 ? '+' : ''}{formatNumber(production)}/h
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
