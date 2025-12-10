// frontend/src/components/Fleet.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { Send, Target, Zap } from 'lucide-react';
import './Fleet.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Button } from './ui';
import AttackConfigModal from './fleet/AttackConfigModal';
import { getAvailableUnits } from '../api/unitUnlocks';

const Fleet = () => {
  const { error, catchError, clearError } = useAsyncError('Fleet');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [attackType, setAttackType] = useState('raid');

  const fetchUnits = async () => {
    setLoading(true);
    try {
      // Récupérer les unités disponibles depuis le système de déverrouillage
      const unitsData = await getAvailableUnits();
      
      // Ne garder que les unités déverrouillées
      const unlockedUnits = unitsData.unlocked || [];
      
      // Récupérer les quantités réelles des unités possédées
      const { data: ownedUnits } = await axiosInstance.get('/units');
      
      // Fusionner les données: définitions des unités + quantités possédées
      const mergedUnits = unlockedUnits.map(unlocked => {
        const owned = ownedUnits.find(u => u.name === unlocked.name);
        return {
          id: unlocked.id,
          entityId: owned?.id, // ID de l'entité unit dans la DB
          name: unlocked.name,
          quantity: owned?.quantity || 0,
          attack: unlocked.attack,
          defense: unlocked.defense,
          health: unlocked.health,
          tier: unlocked.tier,
          cost: unlocked.cost
        };
      });
      
      setUnits(mergedUnits);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuantityChange = (unitId, entityId, value) => {
    const numValue = parseInt(value) || 0;
    const unit = units.find(u => u.id === unitId);
    const maxQuantity = unit?.quantity || 0;
    
    setSelectedUnits(prev => ({
      ...prev,
      [unitId]: {
        entityId,
        quantity: Math.max(0, Math.min(numValue, maxQuantity)),
        name: unit?.name
      }
    }));
  };

  const handleMaxClick = (unitId, entityId, maxQuantity) => {
    const unit = units.find(u => u.id === unitId);
    setSelectedUnits(prev => ({
      ...prev,
      [unitId]: {
        entityId,
        quantity: maxQuantity,
        name: unit?.name
      }
    }));
  };

  const getTotalSelectedUnits = () => {
    return Object.values(selectedUnits).reduce((sum, unit) => sum + unit.quantity, 0);
  };

  const getSelectedUnitsList = () => {
    return Object.entries(selectedUnits)
      .filter(([_, unit]) => unit.quantity > 0)
      .map(([_, unit]) => ({
        entityId: unit.entityId,
        quantity: unit.quantity,
        name: unit.name
      }));
  };

  const handleNextStep = () => {
    const selectedList = getSelectedUnitsList();
    if (selectedList.length === 0) {
      catchError(async () => { 
        throw new Error('Vous devez sélectionner au moins une unité');
      }, { toast: true });
      return;
    }
    setShowConfigModal(true);
  };

  const handleReset = () => {
    setSelectedUnits({});
    clearError();
  };

  const totalSelected = getTotalSelectedUnits();
  const hasSelection = totalSelected > 0;

  return (
    <div className="fleet-container">
      <Menu />
      <div className="fleet-content" id="main-content">
        <ResourcesWidget />

        <div className="fleet-header">
          <div className="fleet-title-section">
            <Send size={40} className="fleet-icon" />
            <h1 className="fleet-title">Centre de Commandement</h1>
          </div>
          <p className="fleet-subtitle">Préparez vos forces et lancez vos opérations militaires</p>
        </div>

        {/* Attack Type Selector */}
        <div className="attack-type-selector">
          <h3>Type d'opération</h3>
          <div className="attack-type-grid">
            <button
              className={`attack-type-card ${attackType === 'raid' ? 'active' : ''}`}
              onClick={() => setAttackType('raid')}
            >
              <Zap size={24} />
              <span className="attack-type-name">Raid</span>
              <span className="attack-type-desc">Pillage rapide de ressources</span>
            </button>
            <button
              className={`attack-type-card ${attackType === 'conquest' ? 'active' : ''}`}
              onClick={() => setAttackType('conquest')}
            >
              <Target size={24} />
              <span className="attack-type-name">Conquête</span>
              <span className="attack-type-desc">Prise de territoire</span>
            </button>
            <button
              className={`attack-type-card ${attackType === 'siege' ? 'active' : ''}`}
              onClick={() => setAttackType('siege')}
            >
              <Send size={24} />
              <span className="attack-type-name">Siège</span>
              <span className="attack-type-desc">Attaque prolongée</span>
            </button>
          </div>
        </div>

        {loading && <Loader label="Chargement des unités" />}
        
        {error && (
          <Alert
            type="error"
            title="Flotte"
            message={error}
            onAction={fetchUnits}
            actionLabel="Réessayer"
          />
        )}

        {/* Units Grid */}
        {!loading && units.length > 0 && (
          <div className="fleet-units-section">
            <h3>Sélectionnez vos unités</h3>
            <div className="fleet-units-grid">
              {units.map((unit) => {
                const selected = selectedUnits[unit.id]?.quantity || 0;
                const isAvailable = unit.quantity > 0;

                return (
                  <div 
                    key={unit.id} 
                    className={`fleet-unit-card ${!isAvailable ? 'unavailable' : ''} ${selected > 0 ? 'selected' : ''}`}
                  >
                    <div className="fleet-unit-image-wrapper">
                      <img
                        src={`/images/training/${unit.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, '').replace(/\s+/g, '_')}.png`}
                        alt={unit.name}
                        className="fleet-unit-image"
                        onError={(e) => { 
                          e.target.onerror = null; // Empêcher la boucle infinie
                          e.target.src = '/images/placeholder.png'; 
                        }}
                      />
                      {selected > 0 && (
                        <div className="selected-badge">{selected}</div>
                      )}
                    </div>
                    
                    <div className="fleet-unit-info">
                      <h4 className="fleet-unit-name">{unit.name}</h4>
                      <p className="fleet-unit-available">
                        Disponible: <span className="quantity-number">{unit.quantity}</span>
                      </p>
                    </div>

                    {isAvailable && (
                      <div className="fleet-unit-controls">
                        <input
                          type="number"
                          min="0"
                          max={unit.quantity}
                          value={selected}
                          onChange={(e) => handleQuantityChange(unit.id, unit.entityid, e.target.value)}
                          className="quantity-input"
                          placeholder="0"
                        />
                        <button
                          className="max-button"
                          onClick={() => handleMaxClick(unit.id, unit.entityid, unit.quantity)}
                        >
                          MAX
                        </button>
                      </div>
                    )}

                    {!isAvailable && (
                      <div className="unavailable-overlay">
                        <span>Aucune unité disponible</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Bar */}
        {!loading && units.length > 0 && (
          <div className="fleet-action-bar">
            <div className="fleet-summary">
              <div className="summary-item">
                <span className="summary-label">Unités sélectionnées:</span>
                <span className="summary-value">{totalSelected}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Type d'opération:</span>
                <span className="summary-value">{
                  attackType === 'raid' ? 'Raid' : 
                  attackType === 'conquest' ? 'Conquête' : 
                  'Siège'
                }</span>
              </div>
            </div>
            
            <div className="fleet-actions">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={!hasSelection}
              >
                Réinitialiser
              </Button>
              <Button
                variant="primary"
                onClick={handleNextStep}
                disabled={!hasSelection}
                icon={<Send size={18} />}
              >
                Configurer l'attaque
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && units.length === 0 && (
          <div className="fleet-empty-state">
            <Send size={64} className="empty-icon" />
            <h3>Aucune unité disponible</h3>
            <p>Entraînez des unités dans le Centre d'entraînement pour pouvoir lancer des attaques</p>
          </div>
        )}

        {/* Attack Config Modal */}
        {showConfigModal && (
          <AttackConfigModal
            attackType={attackType}
            selectedUnits={getSelectedUnitsList()}
            onClose={() => setShowConfigModal(false)}
            onSuccess={() => {
              setShowConfigModal(false);
              handleReset();
              fetchUnits();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Fleet;