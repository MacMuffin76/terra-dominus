import React from 'react';
import './ProductionRates.css';

const ProductionRates = ({ productionRates }) => {
  if (!productionRates) return null;

  const { production, bonuses } = productionRates;

  const formatRate = (rate) => {
    if (rate === 0) return '0/s';
    if (rate < 1) return `${rate.toFixed(2)}/s`;
    return `${Math.floor(rate)}/s`;
  };

  const formatBonus = (bonus) => {
    if (bonus === 0) return null;
    const percentage = (bonus * 100).toFixed(0);
    return `+${percentage}%`;
  };

  return (
    <div className="production-rates">
      <h3>Production par seconde</h3>
      <div className="production-grid">
        <div className="production-item gold">
          <span className="resource-icon">🪙</span>
          <div className="production-details">
            <span className="rate">{formatRate(production.gold)}</span>
            {bonuses.goldProduction > 0 && (
              <span className="bonus">{formatBonus(bonuses.goldProduction)}</span>
            )}
          </div>
        </div>

        <div className="production-item metal">
          <span className="resource-icon">⚙️</span>
          <div className="production-details">
            <span className="rate">{formatRate(production.metal)}</span>
            {bonuses.metalProduction > 0 && (
              <span className="bonus">{formatBonus(bonuses.metalProduction)}</span>
            )}
          </div>
        </div>

        <div className="production-item fuel">
          <span className="resource-icon">⛽</span>
          <div className="production-details">
            <span className="rate">{formatRate(production.fuel)}</span>
            {bonuses.fuelProduction > 0 && (
              <span className="bonus">{formatBonus(bonuses.fuelProduction)}</span>
            )}
          </div>
        </div>

        <div className="production-item energy">
          <span className="resource-icon">⚡</span>
          <div className="production-details">
            <span className="rate">{formatRate(production.energy)}</span>
            {bonuses.energyProduction > 0 && (
              <span className="bonus">{formatBonus(bonuses.energyProduction)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionRates;
