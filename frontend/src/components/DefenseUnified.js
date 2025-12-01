// frontend/src/components/DefenseUnified.js
// Page Défense avec système de déblocage par bâtiments et recherches

import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Lock, Award } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getAvailableDefenses } from '../api/defenseUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { Alert, Loader } from './ui';
import './Defense.css';
import './units/UnitTrainingPanel.css';

/**
 * Defense Card Component
 */
const DefenseUnlockCard = ({ defense, isLocked, onSelect, isSelected }) => {
  const { name, description, tier, stats, cost, missingRequirements, icon } = defense;

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

      {/* Prérequis manquants */}
      {isLocked && missingRequirements && missingRequirements.length > 0 && (
        <div className="requirements">
          <p className="requirements-title">Prérequis:</p>
          {missingRequirements.map((req, idx) => (
            <p key={idx} className="requirement-item">🔒 {req}</p>
          ))}
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
    </div>
  );
};

/**
 * Main Defense Unified Component
 */
const DefenseUnified = () => {
  const { error, catchError } = useAsyncError('DefenseUnified');
  const [loading, setLoading] = useState(true);
  const [availableData, setAvailableData] = useState(null);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [filterTier, setFilterTier] = useState('all');

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
        {tierProgress && tierProgress.currentTier && (
          <div className="tier-progress-banner">
            <div className="progress-info">
              <h3>{tierProgress.currentTier.name || `Tier ${tierProgress.currentTier.tier}`}</h3>
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
        <div className="units-grid">
          {filteredDefenses.map(defense => {
            const isLocked = locked.some(d => d.id === defense.id);

            return (
              <DefenseUnlockCard
                key={defense.id}
                defense={defense}
                isLocked={isLocked}
                onSelect={handleDefenseSelect}
                isSelected={selectedDefense?.id === defense.id}
              />
            );
          })}
        </div>

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
