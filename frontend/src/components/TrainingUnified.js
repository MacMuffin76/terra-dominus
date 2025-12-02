// frontend/src/components/TrainingUnified.js
// Page Centre d'entraînement : Unités disponibles

import React, { useCallback, useEffect, useState } from 'react';
import { Users, Building, Award, Lock, Swords } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getAvailableUnits } from '../api/unitUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { Alert, Loader } from './ui';
import UnitTrainingCard from './units/UnitTrainingCard';
import TierProgressBar from './units/TierProgressBar';
import './Training.css';
import './units/UnitTrainingPanel.css';

/**
 * Page Centre d'Entraînement
 * Affiche les unités débloquées et verrouillées
 */
const TrainingUnified = () => {
  const { error, catchError } = useAsyncError('TrainingUnified');
  
  // État des unités
  const [availableData, setAvailableData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('all');

  // Chargement des unités disponibles
  const loadUnits = useCallback(async () => {
    setUnitsLoading(true);
    try {
      const data = await getAvailableUnits();
      setAvailableData(data);
      setUnitsLoading(false);
    } catch (err) {
      setUnitsLoading(false);
      await catchError(async () => { throw err; }, {
        toast: true,
        logError: true
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sélection d'une unité
  const handleUnitSelect = useCallback((unit) => {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit);
  }, []);

  // Affichage du loader général
  if (unitsLoading && !availableData) {
    return (
      <div className="training-container">
        <Menu />
        <div className="training-content" id="main-content">
          <ResourcesWidget />
          <Loader label="Chargement..." />
        </div>
      </div>
    );
  }

  const { unlocked = [], locked = [], buildings = {}, tierProgress } = availableData || {};
  const allUnits = [...unlocked, ...locked];

  // Filtrage des unités par tier
  const filteredUnits = filterTier === 'all'
    ? allUnits
    : allUnits.filter(u => u.tier === parseInt(filterTier));

  const trainingCenterLevel = buildings.trainingCenterLevel || 0;
  const forgeLevel = buildings.forgeLevel || 0;

  return (
    <div className="training-container">
      <Menu />
      <div className="training-content" id="main-content">
        <ResourcesWidget />

        {/* Header */}
        <div className="unit-training-header">
          <div className="header-title">
            <Swords size={32} />
            <h1>Formation Militaire</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Building size={20} />
              <span>Centre Niv {trainingCenterLevel}</span>
            </div>
            <div className="stat-badge">
              <Award size={20} />
              <span>Forge Niv {forgeLevel}</span>
            </div>
            <div className="stat-badge">
              <Users size={20} />
              <span>{unlocked.length}/{allUnits.length} Débloquées</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            title="Formation Militaire"
            message={error}
            onAction={loadUnits}
          />
        )}

        {/* Tier Progress */}
        {tierProgress && (
          <TierProgressBar
            currentLevel={trainingCenterLevel}
            tierProgress={tierProgress}
          />
        )}

        {/* Filtres de tiers */}
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

        {/* Grille des unités */}
        <div className="units-grid">
          {unitsLoading && <Loader label="Chargement des unités..." />}
          {!unitsLoading && filteredUnits.map(unit => {
            const isLocked = locked.some(u => u.id === unit.id);
            const lockedData = isLocked ? locked.find(u => u.id === unit.id) : null;

            return (
              <UnitTrainingCard
                key={unit.id}
                unit={unit}
                isLocked={isLocked}
                requiredLevel={lockedData?.requiredLevel}
                currentLevel={trainingCenterLevel}
                onSelect={handleUnitSelect}
                isSelected={selectedUnit?.id === unit.id}
              />
            );
          })}
        </div>

        {filteredUnits.length === 0 && !unitsLoading && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune unité disponible pour ce tier</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingUnified;
