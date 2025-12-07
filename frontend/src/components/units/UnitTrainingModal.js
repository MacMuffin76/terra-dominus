import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import './UnitTrainingModal.css';

const UnitTrainingModal = ({ isOpen, onClose, unit, onTrain }) => {
  const [quantity, setQuantity] = useState(1);
  const [isTraining, setIsTraining] = useState(false);

  if (!unit) return null;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(value, 999)));
  };

  const handleTrain = async () => {
    if (quantity < 1) return;

    setIsTraining(true);
    try {
      await onTrain(unit.id, quantity);
      onClose();
      setQuantity(1);
    } finally {
      setIsTraining(false);
    }
  };

  const totalCost = {
    gold: (unit.cost?.gold || 0) * quantity,
    metal: (unit.cost?.metal || 0) * quantity,
    fuel: (unit.cost?.fuel || 0) * quantity,
  };

  const totalUpkeep = {
    gold: (unit.upkeepPerHour?.gold || 0) * quantity,
    metal: (unit.upkeepPerHour?.metal || 0) * quantity,
    fuel: (unit.upkeepPerHour?.fuel || 0) * quantity,
  };

  const footer = (
    <div className="training-modal-footer">
      <button 
        className="btn-secondary" 
        onClick={onClose}
        disabled={isTraining}
      >
        Annuler
      </button>
      <button 
        className="btn-primary" 
        onClick={handleTrain}
        disabled={isTraining || quantity < 1}
      >
        {isTraining ? 'Entraînement...' : `Entraîner ${quantity}x`}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={`Entraîner: ${unit.name}`}
      onClose={onClose}
      footer={footer}
      maxWidth="600px"
    >
      <div className="training-modal-content">
        {/* Unit info */}
        <div className="training-unit-info">
          <div className="training-unit-icon">{unit.icon}</div>
          <div className="training-unit-details">
            <h4>{unit.name}</h4>
            <p className="training-unit-description">{unit.description}</p>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="training-quantity-section">
          <label htmlFor="training-quantity">Quantité à entraîner</label>
          <div className="training-quantity-controls">
            <button 
              className="quantity-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isTraining}
            >
              -
            </button>
            <input
              id="training-quantity"
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={isTraining}
            />
            <button 
              className="quantity-btn"
              onClick={() => setQuantity(Math.min(999, quantity + 1))}
              disabled={isTraining}
            >
              +
            </button>
          </div>
          <div className="training-quick-amounts">
            <button onClick={() => setQuantity(1)} disabled={isTraining}>1</button>
            <button onClick={() => setQuantity(10)} disabled={isTraining}>10</button>
            <button onClick={() => setQuantity(50)} disabled={isTraining}>50</button>
            <button onClick={() => setQuantity(100)} disabled={isTraining}>100</button>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="training-cost-section">
          <h5>Coût total</h5>
          <div className="training-costs">
            {totalCost.gold > 0 && (
              <div className="cost-item">
                <span className="resource-icon">💰</span>
                <span>{totalCost.gold.toLocaleString()} Or</span>
              </div>
            )}
            {totalCost.metal > 0 && (
              <div className="cost-item">
                <span className="resource-icon">⚙️</span>
                <span>{totalCost.metal.toLocaleString()} Métal</span>
              </div>
            )}
            {totalCost.fuel > 0 && (
              <div className="cost-item">
                <span className="resource-icon">⛽</span>
                <span>{totalCost.fuel.toLocaleString()} Carburant</span>
              </div>
            )}
          </div>
        </div>

        {/* Upkeep info */}
        {(totalUpkeep.gold > 0 || totalUpkeep.metal > 0 || totalUpkeep.fuel > 0) && (
          <div className="training-upkeep-section">
            <h5>Entretien (par heure)</h5>
            <div className="training-upkeep">
              {totalUpkeep.gold > 0 && (
                <div className="upkeep-item">
                  <span className="resource-icon">💰</span>
                  <span>{totalUpkeep.gold.toLocaleString()}/h</span>
                </div>
              )}
              {totalUpkeep.metal > 0 && (
                <div className="upkeep-item">
                  <span className="resource-icon">⚙️</span>
                  <span>{totalUpkeep.metal.toLocaleString()}/h</span>
                </div>
              )}
              {totalUpkeep.fuel > 0 && (
                <div className="upkeep-item">
                  <span className="resource-icon">⛽</span>
                  <span>{totalUpkeep.fuel.toLocaleString()}/h</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unit stats */}
        <div className="training-stats-section">
          <h5>Statistiques</h5>
          <div className="training-stats">
            <div className="stat-item">
              <span className="stat-label">⚔️ Attaque</span>
              <span className="stat-value">{unit.attack}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">🛡️ Défense</span>
              <span className="stat-value">{unit.defense}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">❤️ PV</span>
              <span className="stat-value">{unit.health}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">⚡ Initiative</span>
              <span className="stat-value">{unit.initiative}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

UnitTrainingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  unit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    cost: PropTypes.shape({
      gold: PropTypes.number,
      metal: PropTypes.number,
      fuel: PropTypes.number,
    }),
    upkeepPerHour: PropTypes.shape({
      gold: PropTypes.number,
      metal: PropTypes.number,
      fuel: PropTypes.number,
    }),
    attack: PropTypes.number,
    defense: PropTypes.number,
    health: PropTypes.number,
    initiative: PropTypes.number,
  }),
  onTrain: PropTypes.func.isRequired,
};

export default UnitTrainingModal;
