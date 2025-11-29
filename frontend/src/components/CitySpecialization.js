import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import './CitySpecialization.css';
import ResourcesWidget from './ResourcesWidget';
import { getUserCities, setSpecialization, getSpecializationTypes } from '../api/city';

const CitySpecialization = () => {
  const [cities, setCities] = useState([]);
  const [specializationTypes, setSpecializationTypes] = useState({});
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [citiesData, typesData] = await Promise.all([
        getUserCities(),
        getSpecializationTypes()
      ]);
      setCities(citiesData);
      setSpecializationTypes(typesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialize = async (cityId, specialization) => {
    if (!window.confirm(`Voulez-vous spécialiser cette ville en "${getSpecializationLabel(specialization)}" ?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await setSpecialization(cityId, specialization);
      await loadData();
      setSelectedCity(null);
      alert('Spécialisation appliquée avec succès !');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSpecializationLabel = (type) => {
    const labels = {
      none: 'Aucune',
      military: 'Militaire',
      economic: 'Économique',
      industrial: 'Industrielle',
      research: 'Recherche'
    };
    return labels[type] || type;
  };

  const getSpecializationIcon = (type) => {
    const icons = {
      none: '⚪',
      military: '⚔️',
      economic: '💰',
      industrial: '⚙️',
      research: '🔬'
    };
    return icons[type] || '❓';
  };

  const formatBonus = (value) => {
    if (value === 1.0) return '±0%';
    const percent = ((value - 1.0) * 100).toFixed(0);
    return percent > 0 ? `+${percent}%` : `${percent}%`;
  };

  const renderCityCard = (city) => (
    <div key={city.id} className={`city-card ${city.specialization !== 'none' ? 'specialized' : ''}`}>
      <div className="city-header">
        <div className="city-name-row">
          <h3>{city.name}</h3>
          {city.is_capital && <span className="capital-badge">👑 Capitale</span>}
        </div>
        <div className="city-coords">
          📍 ({city.coord_x}, {city.coord_y})
        </div>
      </div>

      <div className="current-specialization">
        <div className="spec-display">
          <span className="spec-icon">{getSpecializationIcon(city.specialization)}</span>
          <span className="spec-name">{getSpecializationLabel(city.specialization)}</span>
        </div>
        {city.specialization !== 'none' && city.specialized_at && (
          <div className="spec-date">
            Depuis le {new Date(city.specialized_at).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      {city.bonuses && city.specialization !== 'none' && (
        <div className="bonuses-summary">
          <h4>📊 Bonus actifs :</h4>
          <div className="bonus-grid">
            {city.bonuses.gold !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">💰 Or</span>
                <span className={`bonus-value ${city.bonuses.gold > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.gold)}
                </span>
              </div>
            )}
            {city.bonuses.metal !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">🔩 Métal</span>
                <span className={`bonus-value ${city.bonuses.metal > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.metal)}
                </span>
              </div>
            )}
            {city.bonuses.fuel !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">⛽ Carburant</span>
                <span className={`bonus-value ${city.bonuses.fuel > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.fuel)}
                </span>
              </div>
            )}
            {city.bonuses.unitProduction !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">⚔️ Prod. Unités</span>
                <span className={`bonus-value ${city.bonuses.unitProduction > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.unitProduction)}
                </span>
              </div>
            )}
            {city.bonuses.researchSpeed !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">🔬 Recherche</span>
                <span className={`bonus-value ${city.bonuses.researchSpeed > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.researchSpeed)}
                </span>
              </div>
            )}
            {city.bonuses.defensiveBonus !== 1.0 && (
              <div className="bonus-item">
                <span className="bonus-label">🛡️ Défense</span>
                <span className={`bonus-value ${city.bonuses.defensiveBonus > 1 ? 'positive' : 'negative'}`}>
                  {formatBonus(city.bonuses.defensiveBonus)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button 
        className="btn-change-spec"
        onClick={() => setSelectedCity(city)}
      >
        {city.specialization === 'none' ? '➕ Choisir une spécialisation' : '🔄 Changer la spécialisation'}
      </button>
    </div>
  );

  const renderSpecializationModal = () => {
    if (!selectedCity) return null;

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        setSelectedCity(null);
      }
    };

    const handleOverlayKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCity(null);
      }
    };

    return (
      <div 
        className="modal-overlay" 
        onClick={handleOverlayClick}
        onKeyDown={handleOverlayKeyDown}
        role="presentation"
      >
        <div className="modal-content" role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>Spécialiser : {selectedCity.name}</h2>
            <button className="modal-close" onClick={() => setSelectedCity(null)}>✕</button>
          </div>

          <div className="specialization-options">
            {Object.entries(specializationTypes).map(([type, bonuses]) => (
              <div 
                key={type} 
                className={`spec-option ${selectedCity.specialization === type ? 'current' : ''}`}
                onClick={() => type !== selectedCity.specialization && handleSpecialize(selectedCity.id, type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && type !== selectedCity.specialization && handleSpecialize(selectedCity.id, type)}
              >
                <div className="spec-option-header">
                  <span className="spec-option-icon">{getSpecializationIcon(type)}</span>
                  <h3>{getSpecializationLabel(type)}</h3>
                  {selectedCity.specialization === type && (
                    <span className="current-badge">Actuel</span>
                  )}
                </div>

                <p className="spec-description">{bonuses.description}</p>

                <div className="spec-bonuses">
                  <div className="bonus-row">
                    <span>💰 Or :</span>
                    <span className={bonuses.gold > 1 ? 'positive' : bonuses.gold < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.gold)}
                    </span>
                  </div>
                  <div className="bonus-row">
                    <span>🔩 Métal :</span>
                    <span className={bonuses.metal > 1 ? 'positive' : bonuses.metal < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.metal)}
                    </span>
                  </div>
                  <div className="bonus-row">
                    <span>⛽ Carburant :</span>
                    <span className={bonuses.fuel > 1 ? 'positive' : bonuses.fuel < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.fuel)}
                    </span>
                  </div>
                  <div className="bonus-row">
                    <span>⚔️ Prod. Unités :</span>
                    <span className={bonuses.unitProduction > 1 ? 'positive' : bonuses.unitProduction < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.unitProduction)}
                    </span>
                  </div>
                  <div className="bonus-row">
                    <span>🔬 Recherche :</span>
                    <span className={bonuses.researchSpeed > 1 ? 'positive' : bonuses.researchSpeed < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.researchSpeed)}
                    </span>
                  </div>
                  <div className="bonus-row">
                    <span>🛡️ Défense :</span>
                    <span className={bonuses.defensiveBonus > 1 ? 'positive' : bonuses.defensiveBonus < 1 ? 'negative' : ''}>
                      {formatBonus(bonuses.defensiveBonus)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="city-specialization-container">
      <Menu />
      <div className="city-specialization-content" id="main-content">
        <ResourcesWidget />
        <h1>🏙️ Spécialisation des Villes</h1>

        {error && (
          <div className="error-message">
            <strong>Erreur:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading && <div className="loader">Chargement...</div>}

        {!loading && cities.length === 0 && (
          <p className="no-data">Aucune ville trouvée</p>
        )}

        <div className="cities-grid">
          {cities.map(city => renderCityCard(city))}
        </div>

        {renderSpecializationModal()}
      </div>
    </div>
  );
};

export default CitySpecialization;
