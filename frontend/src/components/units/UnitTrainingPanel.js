// frontend/src/components/units/UnitTrainingPanel.js

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Award, Lock } from 'lucide-react';
import Menu from '../Menu';
import ResourcesWidget from '../ResourcesWidget';
import UnitTrainingCard from './UnitTrainingCard';
import TierProgressBar from './TierProgressBar';
import { getAvailableUnits } from '../../api/unitUnlocks';
import { useAsyncError } from '../../hooks/useAsyncError';
import { Alert, Loader } from '../ui';
import './UnitTrainingPanel.css';

/**
 * Main panel for unit training with unlock system
 */
const UnitTrainingPanel = () => {
  const { error, catchError } = useAsyncError('UnitTraining');
  const [loading, setLoading] = useState(true);
  const [availableData, setAvailableData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [filterTier, setFilterTier] = useState('all');

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailableUnits();
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
    loadUnits();
  }, [loadUnits]);

  const handleUnitSelect = useCallback((unit) => {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit);
  }, []);

  const handleTrainUnits = useCallback(() => {
    // TODO: Implement training logic
    console.log('Training units:', selectedUnit);
  }, [selectedUnit]);

  if (loading) {
    return (
      <div className="unit-training-container">
        <Menu />
        <div className="unit-training-content" id="main-content">
          <ResourcesWidget />
          <Loader label="Chargement des unités..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="unit-training-container">
        <Menu />
        <div className="unit-training-content" id="main-content">
          <ResourcesWidget />
          <Alert
            type="error"
            title="Erreur"
            message={error}
            onAction={loadUnits}
          />
        </div>
      </div>
    );
  }

  const { unlocked = [], locked = [], nextUnlock, currentLevel, tierProgress } = availableData || {};
  const allUnits = [...unlocked, ...locked];

  // Filter by tier
  const filteredUnits = filterTier === 'all'
    ? allUnits
    : allUnits.filter(u => u.tier === parseInt(filterTier));

  return (
    <div className="unit-training-container">
      <Menu />
      <div className="unit-training-content" id="main-content">
        <ResourcesWidget />

        <div className="unit-training-header">
          <div className="header-title">
            <Users size={32} />
            <h1>Entraînement d'Unités</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Award size={20} />
              <span>Niveau {currentLevel}</span>
            </div>
            <div className="stat-badge">
              <Users size={20} />
              <span>{unlocked.length}/{allUnits.length} Débloquées</span>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {tierProgress && (
          <TierProgressBar
            currentLevel={currentLevel}
            tierProgress={tierProgress}
            nextUnlock={nextUnlock}
          />
        )}

        {/* Next Unlock Banner */}
        {nextUnlock && (
          <div className="next-unlock-banner">
            <Lock size={24} />
            <div className="banner-content">
              <h3>Prochaine Unité</h3>
              <p>
                <strong>{nextUnlock.name}</strong> disponible au niveau {Number(nextUnlock.requiredLevel)}
              </p>
              <span className="levels-remaining">
                {Number(nextUnlock.levelsRemaining)} niveau{nextUnlock.levelsRemaining > 1 ? 'x' : ''} restant{nextUnlock.levelsRemaining > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="tier-filters">
          <button
            className={`filter-tab ${filterTier === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTier('all')}
          >
            Toutes ({allUnits.length})
          </button>
          {[1, 2, 3, 4].map(tier => {
            const count = allUnits.filter(u => u.tier === tier).length;
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

        {/* Units Grid */}
        <div className="units-grid">
          {filteredUnits.map(unit => {
            const isLocked = locked.some(u => u.id === unit.id);
            const lockedData = isLocked ? locked.find(u => u.id === unit.id) : null;

            return (
              <UnitTrainingCard
                key={unit.id}
                unit={unit}
                isLocked={isLocked}
                requiredLevel={lockedData?.requiredLevel}
                currentLevel={currentLevel}
                onSelect={handleUnitSelect}
                isSelected={selectedUnit?.id === unit.id}
              />
            );
          })}
        </div>

        {filteredUnits.length === 0 && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune unité disponible pour ce tier</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitTrainingPanel;
