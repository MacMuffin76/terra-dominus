// frontend/src/components/FacilitiesUnified.js
// Page Installations avec niveaux, bonus et déblocages

import React, { useCallback, useEffect, useState } from 'react';
import { Building, TrendingUp, Lock, Award, ArrowUp } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getPlayerFacilities, getTotalBonuses, upgradeFacility } from '../api/facilityUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Alert, Loader } from './ui';
import './Facilities.css';
import './units/UnitTrainingPanel.css';
import './UnifiedPages.css';

/**
 * Facility Card Component
 */
const FacilityCard = ({ facility, onSelect, isSelected, onUpgrade }) => {
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
    nextLevelUnlocks,
    requiredCommandCenter,
    currentCommandCenterLevel,
    meetsRequirement,
    id
  } = facility;

  const progressPercent = (currentLevel / maxLevel) * 100;

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
    onUpgrade(facility);
  };

  // Déterminer le statut et la classe CSS
  const getStatusConfig = () => {
    if (!isBuilt) return { className: 'not-built', label: 'Non construite' };
    if (isMaxLevel) return { className: 'max-level', label: 'Niveau Max' };
    return { className: '', label: `Niveau ${currentLevel}/${maxLevel}` };
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      className={`facility-card ${statusConfig.className} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(facility)}
      style={{ cursor: !isBuilt ? 'not-allowed' : 'pointer' }}
    >
      <div className="card-header">
        <div className="facility-icon">{icon || <Building size={32} />}</div>
        <div className="facility-info">
          <h3>{name}</h3>
          <span className={`status-badge ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Prérequis Centre de Commandement */}
      {requiredCommandCenter > 0 && (
        <div className={`requirement-badge ${meetsRequirement ? 'met' : 'not-met'}`}>
          <Building size={14} />
          <span>
            {meetsRequirement 
              ? `✓ CC Niv ${requiredCommandCenter}` 
              : `🔒 CC Niv ${requiredCommandCenter} requis (actuel: ${currentCommandCenterLevel})`
            }
          </span>
        </div>
      )}

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

          {/* Action button */}
          {isSelected && (
            <button 
              className="upgrade-action-button"
              onClick={handleUpgradeClick}
              disabled={!meetsRequirement}
              title={!meetsRequirement ? `Centre de Commandement niveau ${requiredCommandCenter} requis` : ''}
            >
              <ArrowUp size={20} />
              <span>Améliorer</span>
            </button>
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
  const { toasts, removeToast, success, error: errorToast, warning } = useToast();
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [totalBonuses, setTotalBonuses] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [upgrading, setUpgrading] = useState(false);

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

  const handleUpgrade = useCallback(async (facility) => {
    if (!facility.key || upgrading) return;

    setUpgrading(true);
    try {
      const result = await upgradeFacility(facility.key);
      // Recharger les données en arrière-plan sans attendre
      loadFacilities().catch(() => {});
      setSelectedFacility(null);
      success(`${facility.name} amélioré au niveau ${facility.currentLevel + 1} !`, 4000);
      console.log('Facility upgraded:', result);
    } catch (err) {
      console.error('Error upgrading facility:', err);
      
      // Extraire le message d'erreur
      const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors de l\'amélioration';
      
      // Si c'est une erreur de prérequis, afficher un warning plus doux
      if (errorMessage.includes('requis') || errorMessage.includes('niveau')) {
        warning(errorMessage, 6000);
      } else {
        errorToast(errorMessage, 5000);
      }
      
      // Recharger quand même pour voir si ça a fonctionné
      loadFacilities().catch(() => {});
    } finally {
      setUpgrading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrading, loadFacilities, success, errorToast, warning]);

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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
              onUpgrade={handleUpgrade}
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
