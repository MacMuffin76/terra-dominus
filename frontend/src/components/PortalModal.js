/**
 * PortalModal Component
 * Modal pour afficher les détails d'un portail et lancer une expédition
 */

import React, { useState, useEffect } from 'react';
import { challengePortal } from '../api/portals';
import { getUserCities } from '../api/world';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { Alert, Loader } from './ui';
import './PortalModal.css';

const TIER_INFO = {
  GREY: { name: 'Gris', color: '#808080', description: 'Portail de rang E - Facile' },
  GREEN: { name: 'Vert', color: '#00FF00', description: 'Portail de rang D - Normal' },
  BLUE: { name: 'Bleu', color: '#0099FF', description: 'Portail de rang C - Difficile' },
  PURPLE: { name: 'Violet', color: '#9933FF', description: 'Portail de rang B - Très difficile' },
  RED: { name: 'Rouge', color: '#FF0000', description: 'Portail de rang A - Extrême' },
  GOLD: { name: 'Or', color: '#FFD700', description: 'Portail de rang S - Légendaire' }
};

const PortalModal = ({ portal, onClose, onExpeditionLaunched }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [units, setUnits] = useState({
    Infantry: 0,
    Tank: 0,
    Artillery: 0,
    APC: 0,
    Helicopter: 0,
    Fighter: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const tierInfo = TIER_INFO[portal.tier] || TIER_INFO.GREY;

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const citiesData = await getUserCities();
      setCities(citiesData);
      if (citiesData.length > 0) {
        setSelectedCity(citiesData[0].id);
      }
      setLoading(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos villes.'));
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!selectedCity) return 0;
    const city = cities.find(c => c.id === selectedCity);
    if (!city || !city.coords) return 0;

    const dx = portal.coord_x - city.coords.x;
    const dy = portal.coord_y - city.coords.y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(1);
  };

  const calculateTravelTime = () => {
    const distance = calculateDistance();
    const hours = distance / 2; // 2 tiles per hour
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours.toFixed(1)} heures`;
  };

  const calculateTotalPower = () => {
    const unitPower = {
      Infantry: 1,
      Tank: 5,
      Artillery: 4,
      APC: 3,
      Helicopter: 6,
      Fighter: 8
    };

    let total = 0;
    Object.entries(units).forEach(([type, count]) => {
      total += (unitPower[type] || 0) * count;
    });
    return total;
  };

  const handleUnitChange = (unitType, value) => {
    const numValue = parseInt(value) || 0;
    setUnits(prev => ({
      ...prev,
      [unitType]: Math.max(0, numValue)
    }));
  };

  const handleLaunchExpedition = async () => {
    if (!selectedCity) {
      setError('Veuillez sélectionner une ville de départ.');
      return;
    }

    const totalUnits = Object.values(units).reduce((sum, count) => sum + count, 0);
    if (totalUnits === 0) {
      setError('Vous devez envoyer au moins une unité.');
      return;
    }

    const power = calculateTotalPower();
    if (power < portal.power * 0.5) {
      if (!window.confirm(`⚠️ Vos unités semblent faibles (${power} vs ${portal.power}).\n\nVos chances de victoire sont très faibles. Continuer ?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      // Filter out units with 0 count
      const activeUnits = {};
      Object.entries(units).forEach(([type, count]) => {
        if (count > 0) {
          activeUnits[type] = count;
        }
      });

      await challengePortal(portal.id, selectedCity, activeUnits);
      
      alert(`✅ Expédition lancée !\n\nVos unités arriveront dans ${calculateTravelTime()}.`);
      onExpeditionLaunched && onExpeditionLaunched();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du lancement de l\'expédition.'));
      setSubmitting(false);
    }
  };

  const formatTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(portal.expires_at);
    const diff = expires - now;

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="portal-modal-overlay" onClick={onClose}>
        <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
          <Loader center label="Chargement..." />
        </div>
      </div>
    );
  }

  const power = calculateTotalPower();
  const powerRatio = portal.power > 0 ? (power / portal.power * 100).toFixed(0) : 0;

  return (
    <div className="portal-modal-overlay" onClick={onClose}>
      <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portal-modal-header" style={{ borderBottom: `3px solid ${tierInfo.color}` }}>
          <h2>
            <span className="portal-tier-badge" style={{ background: tierInfo.color }}>
              {tierInfo.name}
            </span>
            Portail {tierInfo.name}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="portal-modal-content">
          {error && (
            <Alert type="error" message={error} onClose={() => setError(null)} />
          )}

          <div className="portal-info-section">
            <div className="portal-info-grid">
              <div className="info-item">
                <span className="info-label">Position:</span>
                <span className="info-value">({portal.coord_x}, {portal.coord_y})</span>
              </div>
              <div className="info-item">
                <span className="info-label">Puissance:</span>
                <span className="info-value">{portal.power}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Expire dans:</span>
                <span className="info-value">{formatTimeRemaining()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Challenges:</span>
                <span className="info-value">{portal.times_challenged || 0}</span>
              </div>
            </div>

            <div className="portal-description">
              <p>{tierInfo.description}</p>
            </div>

            <div className="portal-enemies">
              <h4>Ennemis présents:</h4>
              <div className="enemies-list">
                {portal.enemies && portal.enemies.length > 0 ? (
                  portal.enemies.map((enemy, idx) => (
                    <div key={idx} className="enemy-item">
                      <span className="enemy-name">{enemy.type}</span>
                      <span className="enemy-count">×{enemy.quantity}</span>
                      <span className="enemy-stats">ATK: {enemy.attack} / DEF: {enemy.defense}</span>
                    </div>
                  ))
                ) : (
                  <p>Ennemis inconnus</p>
                )}
              </div>
            </div>

            <div className="portal-loot">
              <h4>Récompenses potentielles:</h4>
              <div className="loot-preview">
                {portal.loot_table?.guaranteed && (
                  <div className="loot-guaranteed">
                    <strong>Garanti:</strong>
                    <ul>
                      {Object.entries(portal.loot_table.guaranteed).map(([resource, amount]) => (
                        <li key={resource}>
                          {resource}: {amount.min} - {amount.max}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {portal.loot_table?.random && portal.loot_table.random.length > 0 && (
                  <div className="loot-random">
                    <strong>Bonus possibles:</strong>
                    <ul>
                      {portal.loot_table.random.slice(0, 3).map((item, idx) => (
                        <li key={idx}>
                          {item.type} ({item.dropChance}% chance)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="expedition-section">
            <h3>Lancer une expédition</h3>

            <div className="city-select">
              <label>Ville de départ:</label>
              <select 
                value={selectedCity || ''} 
                onChange={(e) => setSelectedCity(parseInt(e.target.value))}
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.coords?.x}, {city.coords?.y})
                  </option>
                ))}
              </select>
            </div>

            {selectedCity && (
              <div className="travel-info">
                <span>Distance: {calculateDistance()} tiles</span>
                <span>Temps de voyage: {calculateTravelTime()}</span>
              </div>
            )}

            <div className="units-selection">
              <h4>Sélectionner vos unités:</h4>
              <div className="units-grid">
                {Object.entries(units).map(([unitType, count]) => (
                  <div key={unitType} className="unit-input">
                    <label>{unitType}:</label>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => handleUnitChange(unitType, e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="power-comparison">
              <div className="power-bar">
                <div className="power-label">Votre puissance: {power}</div>
                <div className="power-progress">
                  <div 
                    className={`power-fill ${powerRatio >= 100 ? 'strong' : powerRatio >= 70 ? 'medium' : 'weak'}`}
                    style={{ width: `${Math.min(100, powerRatio)}%` }}
                  />
                </div>
              </div>
              <div className="portal-power-bar">
                <div className="power-label">Puissance du portail: {portal.power}</div>
              </div>
              <div className="power-verdict">
                {powerRatio >= 120 && <span className="verdict-strong">✓ Victoire probable</span>}
                {powerRatio >= 80 && powerRatio < 120 && <span className="verdict-medium">⚠ Combat équilibré</span>}
                {powerRatio < 80 && <span className="verdict-weak">✗ Risque élevé de défaite</span>}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={handleLaunchExpedition}
                disabled={submitting || !selectedCity || Object.values(units).every(c => c === 0)}
              >
                {submitting ? 'Lancement...' : 'Lancer l\'expédition'}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalModal;
