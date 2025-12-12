// frontend/src/components/DefenseUnified.js
// Page Défense avec système de déblocage par bâtiments et recherches

import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Lock, Award } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getAvailableDefenses } from '../api/defenseUnlocks';
import { buildDefense } from '../api/defenseBuilding';
import { useAsyncError } from '../hooks/useAsyncError';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Alert, Loader } from './ui';
import { useResources } from '../context/ResourcesContext';
import DefenseBuildModal from './defense/DefenseBuildModal';
import PremiumCard from './shared/PremiumCard';
import DetailModal from './shared/DetailModal';
import './Defense.css';
import './units/UnitTrainingPanel.css';
import './shared/PremiumStyles.css';

/**
 * Defense Card Component
 */
const DefenseUnlockCard = ({ defense, isLocked, onSelect, isSelected, onBuildClick }) => {
  const { name, description, tier, stats, cost, missingRequirements, icon } = defense;

  const handleBuildClick = (e) => {
    e.stopPropagation();
    if (!isLocked && onBuildClick) {
      onBuildClick(defense);
    }
  };

  return (
    <div
      className={`unit-training-card ${isLocked ? 'locked' : 'unlocked'} ${isSelected ? 'selected' : ''}`}
      onClick={() => !isLocked && onSelect(defense)}
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
    >
      {isLocked && (
        <div className="lock-overlay">
          <Lock size={32} />
        </div>
      )}

      <div className="card-header">
        <div className="unit-icon">{icon || '🛡️'}</div>
        <div className="unit-info">
          <h3>{name}</h3>
          <span className={`tier-badge tier-${tier}`}>Tier {tier}</span>
        </div>
      </div>

      <p className="unit-description">{description}</p>

      {/* Statistiques */}
      {stats && (
        <div className="unit-stats">
          <div className="stat">
            <span className="stat-label">HP:</span>
            <span className="stat-value">{stats.health}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Attaque:</span>
            <span className="stat-value">{stats.damage}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Portée:</span>
            <span className="stat-value">{stats.range}</span>
          </div>
        </div>
      )}

      {/* Coûts */}
      {cost && (
        <div className="unit-cost">
          {cost.metal > 0 && <span>⚙️ {cost.metal}</span>}
          {cost.energy > 0 && <span>⚡ {cost.energy}</span>}
          {cost.crystal > 0 && <span>💎 {cost.crystal}</span>}
        </div>
      )}

      {/* Prérequis manquants - Version compacte */}
      {isLocked && missingRequirements && missingRequirements.length > 0 && (
        <div className="requirements-compact">
          <div className="requirements-title">
            <Lock size={12} />
            <span>Manquants:</span>
          </div>
          <div className="requirements-list-compact">
            {missingRequirements.map((req, idx) => (
              <span key={idx} className="requirement-chip">{req}</span>
            ))}
          </div>
        </div>
      )}

      {/* Counters et faiblesses */}
      {!isLocked && defense.counters && defense.counters.length > 0 && (
        <div className="counters-info">
          <p className="counters-label">💪 Fort contre: {defense.counters.join(', ')}</p>
        </div>
      )}
      {!isLocked && defense.weakTo && defense.weakTo.length > 0 && (
        <div className="weak-info">
          <p className="weak-label">⚠️ Faible contre: {defense.weakTo.join(', ')}</p>
        </div>
      )}

      {!isLocked && (
        <button 
          className="unit-train-btn"
          onClick={handleBuildClick}
          aria-label={`Construire ${defense.name}`}
          style={{ background: 'linear-gradient(135deg, #ff4444, #cc0000)' }}
        >
          🛡️ Construire
        </button>
      )}
    </div>
  );
};

/**
 * Main Defense Unified Component
 */
const DefenseUnified = () => {
  const { error, catchError } = useAsyncError('DefenseUnified');
  const { toasts, removeToast, success, error: errorToast, warning } = useToast();
  const { setResources } = useResources();
  const [loading, setLoading] = useState(true);
  const [availableData, setAvailableData] = useState(null);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [defenseToBuild, setDefenseToBuild] = useState(null);

  const loadDefenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailableDefenses();
      setAvailableData(data);
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
    loadDefenses();
  }, [loadDefenses]);

  const handleDefenseSelect = useCallback((defense) => {
    setSelectedDefense(prev => prev?.id === defense.id ? null : defense);
  }, []);

  const handleBuildClick = useCallback((defense) => {
    setDefenseToBuild(defense);
    setBuildModalOpen(true);
  }, []);

  const handleBuild = useCallback(async (defenseId, quantity) => {
    try {
      const result = await buildDefense(defenseId, quantity);

      // Afficher un message avec les ressources restantes si disponibles
      const remaining = result?.remainingResources;
      let extraInfo = '';
      if (remaining) {
        const parts = [];
        if (typeof remaining.gold === 'number') parts.push(`Or: ${remaining.gold}`);
        if (typeof remaining.metal === 'number') parts.push(`Métal: ${remaining.metal}`);
        if (typeof remaining.fuel === 'number') parts.push(`Carburant: ${remaining.fuel}`);
        if (parts.length > 0) {
          extraInfo = ` (Ressources restantes → ${parts.join(', ')})`;
        }

        // Mettre à jour les ressources côté client
        const freshResourcesArray = [
          { type: 'or', amount: remaining.gold },
          { type: 'metal', amount: remaining.metal },
          { type: 'carburant', amount: remaining.fuel },
          { type: 'energie', amount: remaining.energy },
        ];
        setResources(freshResourcesArray);

        const resourcesObj = {
          or: remaining.gold,
          metal: remaining.metal,
          carburant: remaining.fuel,
          energie: remaining.energy,
        };
        try {
          localStorage.setItem('localResources', JSON.stringify(resourcesObj));
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined' && window.dispatchUpdateResources) {
          window.dispatchUpdateResources(resourcesObj);
        }
      }

      success(`✅ ${quantity}x ${defenseToBuild?.name} construites avec succès!${extraInfo}`);
      setBuildModalOpen(false);
      setDefenseToBuild(null);
      await loadDefenses();
    } catch (err) {
      errorToast(err.message || 'Erreur lors de la construction de la défense');
    }
  }, [defenseToBuild, success, errorToast, loadDefenses, setResources]);

  const handleLockedDefenseClick = useCallback((defense) => {
    if (defense.missingRequirements && defense.missingRequirements.length > 0) {
      const message = `${defense.name} verrouillée : ${defense.missingRequirements.join(', ')}`;
      warning(message, 6000);
    } else {
      warning(`${defense.name} : Prérequis non remplis`, 4000);
    }
  }, [warning]);

  if (loading) {
    return (
      <div className="defense-container">
        <Menu />
        <div className="defense-content" id="main-content">
          <ResourcesWidget />
          <Loader label="Chargement des défenses..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="defense-container">
        <Menu />
        <div className="defense-content" id="main-content">
          <ResourcesWidget />
          <Alert
            type="error"
            title="Erreur"
            message={error}
            onAction={loadDefenses}
          />
        </div>
      </div>
    );
  }

  const { unlocked = [], locked = [], buildings = {}, tierProgress } = availableData || {};
  const allDefenses = [...unlocked, ...locked];

  // Filter by tier
  const filteredDefenses = filterTier === 'all'
    ? allDefenses
    : allDefenses.filter(d => d.tier === parseInt(filterTier));

  const defenseWorkshopLevel = buildings.defenseWorkshopLevel || 0;

  return (
    <div className="defense-container">
      <Menu />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="defense-content" id="main-content">
        <ResourcesWidget />

        <div className="unit-training-header">
          <div className="header-title">
            <Shield size={32} />
            <h1>Défenses</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Award size={20} />
              <span>Atelier Niv {defenseWorkshopLevel}</span>
            </div>
            <div className="stat-badge">
              <Shield size={20} />
              <span>{unlocked.length}/{allDefenses.length} Débloquées</span>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {tierProgress && tierProgress.currentTier !== undefined && (
          <div className="tier-progress-banner">
            <div className="progress-info">
              <h3>Tier {tierProgress.currentTier}</h3>
              <p>{tierProgress.message}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="tier-filters">
          <button
            className={`filter-tab ${filterTier === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTier('all')}
          >
            Toutes ({allDefenses.length})
          </button>
          {[1, 2, 3, 4].map(tier => {
            const count = allDefenses.filter(d => d.tier === tier).length;
            return (
              <button
                key={tier}
                className={`filter-tab tier-${tier} ${filterTier === String(tier) ? 'active' : ''}`}
                onClick={() => setFilterTier(String(tier))}
              >
                Tier {tier} ({count})
              </button>
            );
          })}
        </div>

        {/* Defenses Grid */}
        <div className="defense-grid">
          {filteredDefenses.map(defense => {
            const isLocked = locked.some(d => d.id === defense.id);

            return (
              <PremiumCard
                key={defense.id}
                title={defense.name}
                image={`/images/defenses/${defense.name.toLowerCase().replace(/\s+/g, '_')}.png`}
                description={defense.description}
                tier={defense.tier}
                badge={defense.icon || '🛡️'}
                isLocked={isLocked}
                lockReason={defense.missingRequirements?.join(', ') || 'Verrouillée'}
                stats={defense.stats || {}}
                cost={defense.cost || {}}
                onClick={() => isLocked ? handleLockedDefenseClick(defense) : handleDefenseSelect(defense)}
                onAction={() => handleBuildClick(defense)}
                actionLabel="Construire"
              />
            );
          })}
        </div>

        {/* Modal de construction */}
        <DefenseBuildModal
          isOpen={buildModalOpen}
          onClose={() => {
            setBuildModalOpen(false);
            setDefenseToBuild(null);
          }}
          defense={defenseToBuild}
          onBuild={handleBuild}
        />

        {filteredDefenses.length === 0 && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune défense disponible pour ce tier</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefenseUnified;
