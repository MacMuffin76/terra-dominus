// frontend/src/components/TrainingUnified.js
// Page unifiée : Installations de formation + Unités disponibles

import React, { useCallback, useEffect, useState } from 'react';
import { Users, Building, Award, Lock, Swords } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import axiosInstance from '../utils/axiosInstance';
import { getAvailableUnits } from '../api/unitUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { Alert, Loader } from './ui';
import UnitTrainingCard from './units/UnitTrainingCard';
import TierProgressBar from './units/TierProgressBar';
import TrainingCard from './training/TrainingCard';
import TrainingDetail from './TrainingDetail';
import './Training.css';
import './units/UnitTrainingPanel.css';

/**
 * Page unifiée combinant :
 * - Installations (Centre d'Entraînement, Forge)
 * - Unités débloquées et verrouillées
 */
const TrainingUnified = () => {
  const { error, catchError } = useAsyncError('TrainingUnified');
  
  // État des installations (bâtiments)
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  
  // État des unités
  const [availableData, setAvailableData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('all');

  // Onglet actif : 'buildings' ou 'units'
  const [activeTab, setActiveTab] = useState('units');

  // Chargement des installations (Centre d'Entraînement, Forge, etc.)
  const fetchFacilities = useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      const { data } = await axiosInstance.get('/training/training-centers');
      setFacilities(data);
      setFacilitiesLoading(false);
    } catch (err) {
      setFacilitiesLoading(false);
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchFacilities();
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sélection / désélection d'une installation
  const handleFacilityClick = useCallback((facility) => {
    if (selectedFacility && selectedFacility.id === facility.id) {
      setSelectedFacility(null);
    } else {
      setSelectedFacility(facility);
    }
  }, [selectedFacility]);

  // Callback appelé après upgrade / destruction d'une installation
  const handleFacilityUpdated = useCallback((updatedFacility) => {
    // Cas suppression : on retire l'entrée et on ferme le panneau
    if (!updatedFacility && selectedFacility) {
      setFacilities((prev) =>
        prev.filter((f) => f.id !== selectedFacility.id)
      );
      setSelectedFacility(null);
      // Recharger les unités car les prérequis ont peut-être changé
      loadUnits();
      return;
    }

    // Cas mise à jour : on met à jour la liste et la sélection
    if (updatedFacility) {
      setFacilities((prev) =>
        prev.map((f) =>
          f.id === updatedFacility.id ? { ...f, ...updatedFacility } : f
        )
      );
      setSelectedFacility(updatedFacility);
      // Recharger les unités car le niveau a changé
      loadUnits();
    }
  }, [selectedFacility, loadUnits]);

  // Sélection d'une unité
  const handleUnitSelect = useCallback((unit) => {
    setSelectedUnit(prev => prev?.id === unit.id ? null : unit);
  }, []);

  const isLoading = facilitiesLoading || unitsLoading;

  // Affichage du loader général
  if (isLoading && !facilities.length && !availableData) {
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
      <div className={`training-content ${selectedFacility ? 'with-details' : ''}`} id="main-content">
        <ResourcesWidget />

        {/* Header avec onglets */}
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

        {/* Onglets de navigation */}
        <div className="tier-filters">
          <button
            className={`filter-tab ${activeTab === 'units' ? 'active' : ''}`}
            onClick={() => setActiveTab('units')}
          >
            <Users size={18} />
            Unités ({allUnits.length})
          </button>
          <button
            className={`filter-tab ${activeTab === 'buildings' ? 'active' : ''}`}
            onClick={() => setActiveTab('buildings')}
          >
            <Building size={18} />
            Installations ({facilities.length})
          </button>
        </div>

        {error && (
          <Alert
            type="error"
            title="Formation Militaire"
            message={error}
            onAction={activeTab === 'units' ? loadUnits : fetchFacilities}
          />
        )}

        {/* ====== ONGLET UNITÉS ====== */}
        {activeTab === 'units' && (
          <>
            {/* Tier Progress */}
            {tierProgress && (
              <TierProgressBar
                currentLevel={trainingCenterLevel}
                tierProgress={tierProgress}
              />
            )}

            {/* Filtres de tiers */}
            <div className="tier-filters" style={{ marginTop: '1rem' }}>
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
          </>
        )}

        {/* ====== ONGLET INSTALLATIONS ====== */}
        {activeTab === 'buildings' && (
          <>
            {selectedFacility && (
              <TrainingDetail
                training={selectedFacility}
                onTrainingUpdated={handleFacilityUpdated}
              />
            )}

            <div className="training-grid">
              {facilitiesLoading && <Loader label="Chargement des installations..." />}
              {(facilitiesLoading ? Array.from({ length: 4 }) : facilities).map((facility, idx) => (
                <TrainingCard
                  key={facility?.id || `facility-skeleton-${idx}`}
                  training={facility}
                  isSelected={selectedFacility?.id === facility?.id}
                  onClick={() => facility && handleFacilityClick(facility)}
                  loading={facilitiesLoading}
                />
              ))}
            </div>

            {facilities.length === 0 && !facilitiesLoading && (
              <div className="empty-state">
                <Building size={48} />
                <p>Aucune installation de formation disponible</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingUnified;
