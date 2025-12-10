// frontend/src/components/TrainingUnified.js
// Page Centre d'entraînement : Unités disponibles

import React, { useCallback, useEffect, useState } from 'react';
import { Users, Building, Award, Lock, Swords } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import { getAvailableUnits } from '../api/unitUnlocks';
import { trainUnits } from '../api/unitTraining';
import { useAsyncError } from '../hooks/useAsyncError';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Alert, Loader } from './ui';
import { useResources } from '../context/ResourcesContext';
import UnitTrainingCard from './units/UnitTrainingCard';
import UnitTrainingModal from './units/UnitTrainingModal';
import TierProgressBar from './units/TierProgressBar';
import './Training.css';
import './units/UnitTrainingPanel.css';

/**
 * Page Centre d'Entraînement
 * Affiche les unités débloquées et verrouillées
 */
const TrainingUnified = () => {
  const { error, catchError } = useAsyncError('TrainingUnified');
  const { toasts, removeToast, success, error: errorToast, warning } = useToast();
  const { setResources } = useResources();
  
  // État des unités
  const [availableData, setAvailableData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('all');
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [unitToTrain, setUnitToTrain] = useState(null);

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

  // Clic sur une unité verrouillée - afficher les prérequis
  const handleLockedUnitClick = useCallback((unit) => {
    if (unit.missingRequirements && unit.missingRequirements.length > 0) {
      const message = `${unit.name} verrouillé : ${unit.missingRequirements.join(', ')}`;
      warning(message, 6000);
    } else {
      warning(`${unit.name} : Prérequis non remplis`, 4000);
    }
  }, [warning]);

  // Ouvrir le modal d'entraînement
  const handleTrainClick = useCallback((unit) => {
    setUnitToTrain(unit);
    setTrainingModalOpen(true);
  }, []);

  // Entraîner des unités
  const handleTrain = useCallback(async (unitId, quantity) => {
    try {
      const result = await trainUnits(unitId, quantity);

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

        // Mettre à jour les ressources côté client (Redux + context production)
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
          // ignore storage errors
        }
        if (typeof window !== 'undefined' && window.dispatchUpdateResources) {
          window.dispatchUpdateResources(resourcesObj);
        }
      }

      success(`✅ ${quantity}x ${unitToTrain?.name} entraînées avec succès!${extraInfo}`);
      setTrainingModalOpen(false);
      setUnitToTrain(null);
      // Recharger les unités (l'état des ressources est renvoyé dans la réponse)
      await loadUnits();
    } catch (err) {
      errorToast(err.message || 'Erreur lors de l\'entraînement des unités');
    }
  }, [unitToTrain, success, errorToast, loadUnits, setResources]);

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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
                onLockedClick={handleLockedUnitClick}
                onTrainClick={handleTrainClick}
                isSelected={selectedUnit?.id === unit.id}
              />
            );
          })}
        </div>

        {/* Modal d'entraînement */}
        <UnitTrainingModal
          isOpen={trainingModalOpen}
          onClose={() => {
            setTrainingModalOpen(false);
            setUnitToTrain(null);
          }}
          unit={unitToTrain}
          onTrain={handleTrain}
        />

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
