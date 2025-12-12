// frontend/src/components/FacilitiesUnified.js
// Page Installations avec niveaux, bonus et déblocages

import React, { useCallback, useEffect, useState } from 'react';
import { Building, TrendingUp, Lock, Award, ArrowUp, Clock } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getPlayerFacilities, getTotalBonuses, upgradeFacility } from '../api/facilityUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Alert, Loader } from './ui';
import PremiumCard from './shared/PremiumCard';
import DetailModal from './shared/DetailModal';
import './Facilities.css';
import './units/UnitTrainingPanel.css';
import './UnifiedPages.css';
import './shared/PremiumStyles.css';

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
    status,
    constructionEndsAt,
    remainingTime: initialRemainingTime,
    id
  } = facility;

  const [remainingTime, setRemainingTime] = useState(initialRemainingTime || 0);

  // Timer countdown
  useEffect(() => {
    if (status !== 'building' || !constructionEndsAt) {
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((new Date(constructionEndsAt) - new Date()) / 1000));
      setRemainingTime(remaining);
      
      if (remaining === 0) {
        // Reload facilities when construction completes
        window.location.reload();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [status, constructionEndsAt]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const progressPercent = (currentLevel / maxLevel) * 100;

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
    onUpgrade(facility);
  };

  // Déterminer le statut et la classe CSS
  const getStatusConfig = () => {
    if (status === 'building') return { className: 'building', label: '🏗️ En construction' };
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

      {/* Construction Timer */}
      {status === 'building' && remainingTime > 0 && (
        <div className="construction-timer">
          <Clock size={16} />
          <span>Niveau {currentLevel + 1} dans {formatTime(remainingTime)}</span>
        </div>
      )}

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
              disabled={!meetsRequirement || status === 'building'}
              title={
                status === 'building' ? 'Construction en cours' :
                !meetsRequirement ? `Centre de Commandement niveau ${requiredCommandCenter} requis` : ''
              }
            >
              <ArrowUp size={20} />
              <span>{status === 'building' ? 'En construction...' : 'Améliorer'}</span>
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
      
      // Message plus clair indiquant que c'est une construction
      const buildDuration = result.buildDuration || 0;
      const minutes = Math.floor(buildDuration / 60);
      const seconds = buildDuration % 60;
      const timeStr = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;
      
      success(`Construction de ${facility.name} niveau ${facility.currentLevel + 1} démarrée ! (${timeStr})`, 5000);
      console.log('Facility upgrade started:', result);
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

        {/* Facilities Grid */}
        <div className="facilities-grid">
          {facilities.map(facility => {
            const getTier = (cat) => {
              if (cat === 'Militaire') return 3;
              if (cat === 'Économie') return 2;
              return 1;
            };

            return (
              <PremiumCard
                key={facility.key}
                title={facility.name}
                image={`/images/facilities/${facility.name.toLowerCase().replace(/\s+/g, '_')}.png`}
                description={facility.description}
                tier={getTier(facility.category)}
                level={facility.currentLevel}
                maxLevel={facility.maxLevel}
                isLocked={!facility.isBuilt}
                lockReason={!facility.meetsRequirement ? `Centre de Commandement Niv ${facility.requiredCommandCenter} requis` : 'Non construite'}
                isInProgress={facility.status === 'building'}
                buildTime={facility.constructionEndsAt}
                badge={facility.icon || '🏗️'}
                stats={facility.currentBonuses || {}}
                cost={facility.upgradeCost || {}}
                onClick={() => handleFacilitySelect(facility)}
                onAction={() => handleUpgrade(facility)}
                actionLabel={facility.status === 'building' ? 'En construction...' : (facility.isMaxLevel ? 'Niveau Max' : 'Améliorer')}
              />
            );
          })}
        </div>

        {facilities.length === 0 && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune installation disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesUnified;
