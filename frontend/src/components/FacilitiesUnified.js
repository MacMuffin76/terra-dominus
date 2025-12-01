// frontend/src/components/FacilitiesUnified.js
// Page Installations avec niveaux, bonus et déblocages

import React, { useCallback, useEffect, useState } from 'react';
import { Building, TrendingUp, Lock, Award } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getPlayerFacilities, getTotalBonuses } from '../api/facilityUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { Alert, Loader } from './ui';
import './Facilities.css';
import './units/UnitTrainingPanel.css';
import './UnifiedPages.css';

/**
 * Facility Card Component
 */
const FacilityCard = ({ facility, onSelect, isSelected }) => {
  const { 
    name, 
    description, 
    icon, 
    category,
    currentLevel, 
    maxLevel, 
    isBuilt,
    isMaxLevel,
    currentBonuses,
    nextBonuses,
    upgradeCost,
    nextLevelUnlocks
  } = facility;

  const progressPercent = (currentLevel / maxLevel) * 100;

  return (
    <div
      className={`facility-card ${!isBuilt ? 'not-built' : ''} ${isMaxLevel ? 'max-level' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(facility)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-header">
        <div className="facility-icon">{icon || '🏗️'}</div>
        <div className="facility-info">
          <h3>{name}</h3>
          <span className={`category-badge ${category}`}>{category}</span>
        </div>
      </div>

      <p className="facility-description">{description}</p>

      {/* Niveau actuel */}
      <div className="facility-level">
        <div className="level-info">
          <span className="level-label">Niveau:</span>
          <span className="level-value">{currentLevel} / {maxLevel}</span>
        </div>
        <div className="level-progress-bar">
          <div 
            className="level-progress-fill" 
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: isMaxLevel ? '#4ade80' : '#3b82f6'
            }}
          />
        </div>
      </div>

      {/* Bonus actuels */}
      {currentBonuses && Object.keys(currentBonuses).length > 0 && (
        <div className="facility-bonuses">
          <p className="bonuses-title">Bonus actuels:</p>
          {Object.entries(currentBonuses).map(([key, value]) => (
            <p key={key} className="bonus-item">
              📈 {key}: +{(value * 100).toFixed(1)}%
            </p>
          ))}
        </div>
      )}

      {/* Prochain niveau */}
      {!isMaxLevel && nextBonuses && (
        <div className="next-level-info">
          <p className="next-level-title">Niveau {currentLevel + 1}:</p>
          {Object.entries(nextBonuses).map(([key, value]) => (
            <p key={key} className="next-bonus-item">
              🔼 {key}: +{(value * 100).toFixed(1)}%
            </p>
          ))}
          
          {/* Déblocages */}
          {nextLevelUnlocks && nextLevelUnlocks.length > 0 && (
            <div className="unlocks">
              <p className="unlocks-title">🔓 Débloque:</p>
              <p className="unlocks-list">{nextLevelUnlocks.join(', ')}</p>
            </div>
          )}

          {/* Coût upgrade */}
          {upgradeCost && (
            <div className="upgrade-cost">
              <p className="cost-title">Coût amélioration:</p>
              <div className="cost-values">
                {upgradeCost.metal > 0 && <span>⚙️ {upgradeCost.metal}</span>}
                {upgradeCost.energy > 0 && <span>⚡ {upgradeCost.energy}</span>}
                {upgradeCost.crystal > 0 && <span>💎 {upgradeCost.crystal}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {isMaxLevel && (
        <div className="max-level-badge">
          <Award size={20} />
          <span>Niveau Maximum Atteint!</span>
        </div>
      )}

      {!isBuilt && (
        <div className="not-built-overlay">
          <Lock size={32} />
          <p>Non construite</p>
        </div>
      )}
    </div>
  );
};

/**
 * Total Bonuses Summary Component
 */
const BonusesSummary = ({ bonuses }) => {
  if (!bonuses || !bonuses.summary || bonuses.summary.length === 0) {
    return null;
  }

  return (
    <div className="bonuses-summary">
      <h3>
        <TrendingUp size={24} />
        Bonus Totaux de vos Installations
      </h3>
      <div className="bonuses-grid">
        {bonuses.summary.map(({ bonus, value, formatted }) => (
          <div key={bonus} className="bonus-card">
            <span className="bonus-name">{bonus}</span>
            <span className="bonus-value">{formatted}</span>
          </div>
        ))}
      </div>
      <p className="bonuses-note">
        📊 {bonuses.facilities.length} installation{bonuses.facilities.length > 1 ? 's' : ''} active{bonuses.facilities.length > 1 ? 's' : ''}
      </p>
    </div>
  );
};

/**
 * Main Facilities Unified Component
 */
const FacilitiesUnified = () => {
  const { error, catchError } = useAsyncError('FacilitiesUnified');
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [totalBonuses, setTotalBonuses] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const [facilitiesData, bonusesData] = await Promise.all([
        getPlayerFacilities(),
        getTotalBonuses()
      ]);
      setFacilities(facilitiesData);
      setTotalBonuses(bonusesData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await catchError(async () => { throw err; }, {
        toast: true,
        logError: true
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const handleFacilitySelect = useCallback((facility) => {
    setSelectedFacility(prev => prev?.id === facility.id ? null : facility);
  }, []);

  if (loading) {
    return (
      <div className="facilities-container">
        <Menu />
        <div className="facilities-content" id="main-content">
          <ResourcesWidget />
          <Loader label="Chargement des installations..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="facilities-container">
        <Menu />
        <div className="facilities-content" id="main-content">
          <ResourcesWidget />
          <Alert
            type="error"
            title="Erreur"
            message={error}
            onAction={loadFacilities}
          />
        </div>
      </div>
    );
  }

  // Filtrer par catégorie
  const filteredFacilities = filterCategory === 'all'
    ? facilities
    : facilities.filter(f => f.category === filterCategory);

  // Obtenir les catégories uniques
  const uniqueCategories = [...new Set(facilities.map(f => f.category))];

  const builtCount = facilities.filter(f => f.isBuilt).length;
  const maxLevelCount = facilities.filter(f => f.isMaxLevel).length;

  return (
    <div className="facilities-container">
      <Menu />
      <div className="facilities-content" id="main-content">
        <ResourcesWidget />

        <div className="unit-training-header">
          <div className="header-title">
            <Building size={32} />
            <h1>Installations Stratégiques</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Building size={20} />
              <span>{builtCount} / {facilities.length} Construites</span>
            </div>
            <div className="stat-badge">
              <Award size={20} />
              <span>{maxLevelCount} Niv Max</span>
            </div>
          </div>
        </div>

        {/* Total Bonuses Summary */}
        {totalBonuses && <BonusesSummary bonuses={totalBonuses} />}

        {/* Filter Tabs - Category */}
        <div className="tier-filters" style={{ marginTop: '1.5rem' }}>
          <button
            className={`filter-tab ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Toutes ({facilities.length})
          </button>
          {uniqueCategories.map(category => {
            const count = facilities.filter(f => f.category === category).length;
            return (
              <button
                key={category}
                className={`filter-tab ${filterCategory === category ? 'active' : ''}`}
                onClick={() => setFilterCategory(category)}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>

        {/* Facilities Grid */}
        <div className="facilities-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          {filteredFacilities.map(facility => (
            <FacilityCard
              key={facility.key}
              facility={facility}
              onSelect={handleFacilitySelect}
              isSelected={selectedFacility?.key === facility.key}
            />
          ))}
        </div>

        {filteredFacilities.length === 0 && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune installation dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesUnified;
