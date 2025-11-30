// frontend/src/components/units/UnitTrainingCard.js

import React from 'react';
import { Lock, TrendingUp, Shield, Zap } from 'lucide-react';
import './UnitTrainingCard.css';

/**
 * Unit card with unlock status
 * Shows locked units with level requirement
 */
const UnitTrainingCard = ({ 
  unit, 
  isLocked, 
  requiredLevel, 
  currentLevel,
  onSelect,
  isSelected 
}) => {
  const handleClick = () => {
    if (!isLocked && onSelect) {
      onSelect(unit);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'infantry':
        return '🪖';
      case 'mounted':
        return '🐎';
      case 'siege':
        return '💣';
      case 'armor':
        return '🛡️';
      case 'air':
        return '✈️';
      case 'support':
        return '🔧';
      default:
        return '⚔️';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 1:
        return '#9E9E9E'; // Gray
      case 2:
        return '#4CAF50'; // Green
      case 3:
        return '#2196F3'; // Blue
      case 4:
        return '#9C27B0'; // Purple
      default:
        return '#757575';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`unit-training-card ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked}
      style={{ borderColor: getTierColor(unit.tier) }}
    >
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
          <span className="level-requirement">Level {requiredLevel}</span>
        </div>
      )}

      <div className="unit-card-header">
        <div className="unit-icon">
          {getCategoryIcon(unit.category)}
        </div>
        <div className="unit-header-info">
          <h3 className="unit-name">{unit.name}</h3>
          <span className="unit-tier" style={{ color: getTierColor(unit.tier) }}>
            Tier {unit.tier}
          </span>
        </div>
      </div>

      <p className="unit-description">{unit.description}</p>

      <div className="unit-stats">
        <div className="stat">
          <TrendingUp size={16} className="stat-icon attack" />
          <span className="stat-label">Attack</span>
          <span className="stat-value">{unit.attack}</span>
        </div>
        <div className="stat">
          <Shield size={16} className="stat-icon defense" />
          <span className="stat-label">Defense</span>
          <span className="stat-value">{unit.defense}</span>
        </div>
        <div className="stat">
          <Zap size={16} className="stat-icon health" />
          <span className="stat-label">Health</span>
          <span className="stat-value">{unit.health}</span>
        </div>
      </div>

      <div className="unit-costs">
        <div className="cost-section">
          <span className="cost-label">Cost:</span>
          <div className="cost-values">
            {unit.cost?.gold > 0 && <span className="cost gold">{Number(unit.cost.gold)}g</span>}
            {unit.cost?.metal > 0 && <span className="cost metal">{Number(unit.cost.metal)}m</span>}
            {unit.cost?.fuel > 0 && <span className="cost fuel">{Number(unit.cost.fuel)}f</span>}
          </div>
        </div>
        <div className="upkeep-section">
          <span className="upkeep-label">Upkeep/h:</span>
          <div className="upkeep-values">
            {unit.upkeepPerHour?.gold > 0 && <span className="upkeep gold">{Number(unit.upkeepPerHour.gold)}g</span>}
            {unit.upkeepPerHour?.metal > 0 && <span className="upkeep metal">{Number(unit.upkeepPerHour.metal)}m</span>}
            {unit.upkeepPerHour?.fuel > 0 && <span className="upkeep fuel">{Number(unit.upkeepPerHour.fuel)}f</span>}
          </div>
        </div>
      </div>

      {unit.counters && Array.isArray(unit.counters) && unit.counters.length > 0 && !isLocked && (
        <div className="unit-counters">
          <span className="counters-label">✅ Strong vs:</span>
          <span className="counters-list">{unit.counters.join(', ')}</span>
        </div>
      )}

      {unit.weakTo && Array.isArray(unit.weakTo) && unit.weakTo.length > 0 && !isLocked && (
        <div className="unit-weaknesses">
          <span className="weak-label">⚠️ Weak to:</span>
          <span className="weak-list">{unit.weakTo.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

export default UnitTrainingCard;
