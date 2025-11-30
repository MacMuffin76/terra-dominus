/**
 * PortalAttackForm Component
 * Unit selection and tactic configuration
 */

import React from 'react';
import './PortalAttackForm.css';

const UNIT_TYPES = [
  { key: 'infantry', label: 'Infanterie', icon: '🪖' },
  { key: 'tank', label: 'Tanks', icon: '🚜' },
  { key: 'artillery', label: 'Artillerie', icon: '🎯' },
  { key: 'apc', label: 'APC', icon: '🚐' },
  { key: 'helicopter', label: 'Hélicoptères', icon: '🚁' },
  { key: 'fighter', label: 'Chasseurs', icon: '✈️' }
];

const TACTICS = [
  { 
    value: 'balanced', 
    label: 'Équilibrée', 
    description: 'Bonus équilibrés en attaque et défense',
    icon: '⚖️'
  },
  { 
    value: 'aggressive', 
    label: 'Agressive', 
    description: '+20% attaque, -10% défense',
    icon: '⚔️'
  },
  { 
    value: 'defensive', 
    label: 'Défensive', 
    description: '+20% défense, -10% attaque',
    icon: '🛡️'
  }
];

const PortalAttackForm = ({ units, tactic, onUnitsChange, onTacticChange }) => {
  const handleUnitChange = (unitType, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    onUnitsChange({
      ...units,
      [unitType]: numValue
    });
  };

  const handlePreset = (preset) => {
    const presetUnits = { ...units };
    
    switch (preset) {
      case 'clear':
        Object.keys(presetUnits).forEach(key => presetUnits[key] = 0);
        break;
      case 'balanced':
        Object.keys(presetUnits).forEach(key => presetUnits[key] = 100);
        break;
      case 'ground':
        presetUnits.infantry = 300;
        presetUnits.tank = 150;
        presetUnits.artillery = 100;
        presetUnits.apc = 50;
        presetUnits.helicopter = 0;
        presetUnits.fighter = 0;
        break;
      case 'air':
        presetUnits.infantry = 0;
        presetUnits.tank = 0;
        presetUnits.artillery = 0;
        presetUnits.apc = 0;
        presetUnits.helicopter = 200;
        presetUnits.fighter = 100;
        break;
      default:
        break;
    }
    
    onUnitsChange(presetUnits);
  };

  const getTotalUnits = () => {
    return Object.values(units).reduce((sum, val) => sum + val, 0);
  };

  return (
    <div className="portal-attack-form">
      {/* Unit Selection */}
      <div className="units-section">
        <div className="units-header">
          <h4>Sélection des Unités</h4>
          <div className="presets">
            <button className="preset-btn" onClick={() => handlePreset('clear')} title="Réinitialiser">
              🗑️
            </button>
            <button className="preset-btn" onClick={() => handlePreset('balanced')} title="Équilibré">
              ⚖️
            </button>
            <button className="preset-btn" onClick={() => handlePreset('ground')} title="Armée Terrestre">
              🪖
            </button>
            <button className="preset-btn" onClick={() => handlePreset('air')} title="Force Aérienne">
              ✈️
            </button>
          </div>
        </div>

        <div className="units-grid">
          {UNIT_TYPES.map(unit => (
            <div key={unit.key} className="unit-input-group">
              <label>
                <span className="unit-icon">{unit.icon}</span>
                <span className="unit-label">{unit.label}</span>
              </label>
              <input
                type="number"
                min="0"
                value={units[unit.key]}
                onChange={(e) => handleUnitChange(unit.key, e.target.value)}
                className="unit-input"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="total-units">
          <span>Total d'unités:</span>
          <span className="total-value">{getTotalUnits().toLocaleString()}</span>
        </div>
      </div>

      {/* Tactic Selection */}
      <div className="tactic-section">
        <h4>Tactique de Combat</h4>
        <div className="tactics-grid">
          {TACTICS.map(tacticOption => (
            <label 
              key={tacticOption.value}
              className={`tactic-option ${tactic === tacticOption.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="tactic"
                value={tacticOption.value}
                checked={tactic === tacticOption.value}
                onChange={(e) => onTacticChange(e.target.value)}
              />
              <div className="tactic-content">
                <span className="tactic-icon">{tacticOption.icon}</span>
                <span className="tactic-label">{tacticOption.label}</span>
                <span className="tactic-description">{tacticOption.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalAttackForm;
