import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../ui/Modal';
import './DefenseBuildModal.css';

const DefenseBuildModal = ({ isOpen, onClose, defense, onBuild }) => {
  const [quantity, setQuantity] = useState(1);
  const [isBuilding, setIsBuilding] = useState(false);

  if (!defense) return null;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(value, 999)));
  };

  const handleBuild = async () => {
    if (quantity < 1) return;

    setIsBuilding(true);
    try {
      await onBuild(defense.id, quantity);
      onClose();
      setQuantity(1);
    } finally {
      setIsBuilding(false);
    }
  };

  const totalCost = {
    gold: (defense.cost?.gold || 0) * quantity,
    metal: (defense.cost?.metal || 0) * quantity,
    fuel: (defense.cost?.fuel || 0) * quantity,
  };

  const totalUpkeep = {
    gold: (defense.upkeepPerHour?.gold || 0) * quantity,
    metal: (defense.upkeepPerHour?.metal || 0) * quantity,
    fuel: (defense.upkeepPerHour?.fuel || 0) * quantity,
  };

  const footer = (
    <div className="defense-build-modal-footer">
      <button 
        className="btn-secondary" 
        onClick={onClose}
        disabled={isBuilding}
      >
        Annuler
      </button>
      <button 
        className="btn-primary" 
        onClick={handleBuild}
        disabled={isBuilding || quantity < 1}
      >
        {isBuilding ? 'Construction...' : `Construire ${quantity}x`}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={`Construire: ${defense.name}`}
      onClose={onClose}
      footer={footer}
      maxWidth="600px"
    >
      <div className="defense-build-modal-content">
        {/* Defense info */}
        <div className="defense-build-info">
          <div className="defense-build-icon">{defense.icon}</div>
          <div className="defense-build-details">
            <h4>{defense.name}</h4>
            <p className="defense-build-description">{defense.description}</p>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="defense-quantity-section">
          <label htmlFor="defense-quantity">Quantité à construire</label>
          <div className="defense-quantity-controls">
            <button 
              className="quantity-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isBuilding}
            >
              -
            </button>
            <input
              id="defense-quantity"
              type="number"
              min="1"
              max="999"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={isBuilding}
            />
            <button 
              className="quantity-btn"
              onClick={() => setQuantity(Math.min(999, quantity + 1))}
              disabled={isBuilding}
            >
              +
            </button>
          </div>
          <div className="defense-quick-amounts">
            <button onClick={() => setQuantity(1)} disabled={isBuilding}>1</button>
            <button onClick={() => setQuantity(10)} disabled={isBuilding}>10</button>
            <button onClick={() => setQuantity(50)} disabled={isBuilding}>50</button>
            <button onClick={() => setQuantity(100)} disabled={isBuilding}>100</button>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="defense-cost-section">
          <h5>Coût total</h5>
          <div className="defense-costs">
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
          <div className="defense-upkeep-section">
            <h5>Entretien (par heure)</h5>
            <div className="defense-upkeep">
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

        {/* Defense stats */}
        {defense.stats && (
          <div className="defense-stats-section">
            <h5>Statistiques</h5>
            <div className="defense-stats">
              {defense.stats.health && (
                <div className="stat-item">
                  <span className="stat-label">❤️ PV</span>
                  <span className="stat-value">{defense.stats.health}</span>
                </div>
              )}
              {defense.stats.damage && (
                <div className="stat-item">
                  <span className="stat-label">⚔️ Dégâts</span>
                  <span className="stat-value">{defense.stats.damage}</span>
                </div>
              )}
              {defense.stats.range && (
                <div className="stat-item">
                  <span className="stat-label">🎯 Portée</span>
                  <span className="stat-value">{defense.stats.range}</span>
                </div>
              )}
              {defense.defense && (
                <div className="stat-item">
                  <span className="stat-label">🛡️ Défense</span>
                  <span className="stat-value">{defense.defense}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

DefenseBuildModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defense: PropTypes.shape({
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
    stats: PropTypes.shape({
      health: PropTypes.number,
      damage: PropTypes.number,
      range: PropTypes.string,
    }),
    defense: PropTypes.number,
  }),
  onBuild: PropTypes.func.isRequired,
};

export default DefenseBuildModal;
