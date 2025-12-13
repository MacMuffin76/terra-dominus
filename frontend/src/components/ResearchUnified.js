// frontend/src/components/ResearchUnified.js
// Page Recherche avec système de déblocage par bâtiments et prérequis

import React, { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Lock, Award, CheckCircle, Clock, Play } from 'lucide-react';
import Menu from './Menu';
import ResourcesWidget from './ResourcesWidget';
import {
  getAvailableResearch,
  startResearch,
  accelerateResearch,
  cancelResearch,
} from '../api/researchUnlocks';
import { useAsyncError } from '../hooks/useAsyncError';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Alert, Loader } from './ui';
import PremiumCard from './shared/PremiumCard';
import DetailModal from './shared/DetailModal';
import './Research.css';
import './units/UnitTrainingPanel.css';
import './UnifiedPages.css';

/**
 * Research Card Component
 */
const ResearchCard = ({ research, status, onSelect, isSelected, onStart }) => {
  const { name, description, category, cost, effects, missingRequirements, icon, id } = research;

  const handleStartClick = (e) => {
    e.stopPropagation();
    onStart(research);
  };

  const statusConfig = {
    completed: { 
      icon: <CheckCircle size={24} />, 
      label: 'Complétée', 
      className: 'completed',
      bgColor: '#1a472a'
    },
    inProgress: { 
      icon: <Clock size={24} />, 
      label: 'En cours', 
      className: 'in-progress',
      bgColor: '#3d2b1f'
    },
    available: { 
      icon: <FlaskConical size={24} />, 
      label: 'Disponible', 
      className: 'available',
      bgColor: '#1a3a5a'
    },
    locked: { 
      icon: <Lock size={24} />, 
      label: 'Verrouillée', 
      className: 'locked',
      bgColor: '#2a2a2a'
    }
  };

  const config = statusConfig[status] || statusConfig.locked;

  return (
    <div
      className={`research-card ${config.className} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(research)}
      style={{ 
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        backgroundColor: config.bgColor,
        borderColor: isSelected ? '#4a9eff' : 'transparent'
      }}
    >
      <div className="card-header">
        <div className="research-icon">{icon || config.icon}</div>
        <div className="research-info">
          <h3>{name}</h3>
          <span className={`status-badge ${config.className}`}>{config.label}</span>
        </div>
      </div>

      <p className="research-description">{description}</p>

      {/* Catégorie */}
      <div className="research-category">
        <span className="category-badge">{category}</span>
      </div>

      {/* Coûts */}
      {cost && status !== 'completed' && (
        <div className="research-cost">
          {cost.metal > 0 && <span>⚙️ {cost.metal}</span>}
          {cost.energy > 0 && <span>⚡ {cost.energy}</span>}
          {cost.crystal > 0 && <span>💎 {cost.crystal}</span>}
          {cost.time && <span>⏱️ {cost.time}h</span>}
        </div>
      )}

      {/* Effets */}
      {effects && status !== 'locked' && (
        <div className="research-effects">
          <p className="effects-title">Effets:</p>
          {effects.unlocks && effects.unlocks.length > 0 && (
            <p className="effect-item">🔓 Débloque: {effects.unlocks.join(', ')}</p>
          )}
          {effects.resourceProductionBonus && (
            <p className="effect-item">📈 Production: +{(effects.resourceProductionBonus * 100).toFixed(0)}%</p>
          )}
          {effects.buildingCostReduction && (
            <p className="effect-item">💰 Coût bâtiments: -{(effects.buildingCostReduction * 100).toFixed(0)}%</p>
          )}
          {effects.infantryAttackBonus && (
            <p className="effect-item">⚔️ Attaque infanterie: +{(effects.infantryAttackBonus * 100).toFixed(0)}%</p>
          )}
        </div>
      )}

      {/* Action button - only for available research */}
      {status === 'available' && isSelected && (
        <button 
          className="research-action-button"
          onClick={handleStartClick}
        >
          <Play size={20} />
          <span>Lancer la recherche</span>
        </button>
      )}

      {/* Prérequis manquants - Version compacte */}
      {status === 'locked' && missingRequirements && missingRequirements.length > 0 && (
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
    </div>
  );
};

/**
 * Main Research Unified Component
 */
const ResearchUnified = () => {
  const { error, catchError } = useAsyncError('ResearchUnified');
  const { toasts, removeToast, success, error: errorToast, warning } = useToast();
  const [loading, setLoading] = useState(true);
  const [researchData, setResearchData] = useState(null);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [starting, setStarting] = useState(false);
  const [queueAction, setQueueAction] = useState(null);

  const loadResearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailableResearch();
      setResearchData(data);
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
    loadResearch();
  }, [loadResearch]);

  const handleResearchSelect = useCallback((research) => {
    setSelectedResearch(prev => prev?.id === research.id ? null : research);
  }, []);

  const handleStartResearch = useCallback(async (research) => {
    if (!research.id || starting) return;
    setStarting(true);
    try {
      const result = await startResearch(research.id);
      // Recharger les données en arrière-plan sans attendre
      loadResearch().catch(() => {});
      setSelectedResearch(null);
      success(`${research.name} ajoutée à la file de recherche !`, 4000);
      console.log('Research started:', result);
    } catch (err) {
      console.error('Error starting research:', err);
      
      // Extraire le message d'erreur
      const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors du lancement de la recherche';
      
      // Si c'est une erreur de prérequis, afficher un warning plus doux
      if (errorMessage.includes('requis') || errorMessage.includes('Niveau') || errorMessage.includes('Recherche:')) {
        warning(errorMessage, 6000);
      } else {
        errorToast(errorMessage, 5000);
      }
      
      // Recharger quand même pour voir si ça a fonctionné
      loadResearch().catch(() => {});
    } finally {
      setStarting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starting, loadResearch, success, errorToast, warning]);

  const handleAccelerate = useCallback(async (item) => {
    if (!item?.id) return;
    setQueueAction(item.id);
    try {
      await accelerateResearch(item.id);
      success('Recherche accélérée !');
      loadResearch().catch(() => {});
    } catch (err) {
      const message = err?.response?.data?.message || 'Impossible d’accélérer cette recherche';
      errorToast(message, 5000);
    } finally {
      setQueueAction(null);
    }
  }, [errorToast, loadResearch, success]);

  const handleCancel = useCallback(async (item) => {
    if (!item?.id) return;
    setQueueAction(item.id);
    try {
      await cancelResearch(item.id);
      success('Recherche retirée de la file');
      loadResearch().catch(() => {});
    } catch (err) {
      const message = err?.response?.data?.message || 'Impossible d’annuler cette recherche';
      errorToast(message, 5000);
    } finally {
      setQueueAction(null);
    }
  }, [errorToast, loadResearch, success]);

  const formatDuration = (seconds) => {
    const value = Number(seconds) || 0;
    if (value < 60) return `${value}s`;
    const minutes = Math.floor(value / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) return `${hours}h ${remainingMinutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="research-container">
        <Menu />
        <div className="research-content" id="main-content">
          <ResourcesWidget />
          <Loader label="Chargement des recherches..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="research-container">
        <Menu />
        <div className="research-content" id="main-content">
          <ResourcesWidget />
          <Alert
            type="error"
            title="Erreur"
            message={error}
            onAction={loadResearch}
          />
        </div>
      </div>
    );
  }

  const { available = [], inProgress = [], completed = [], locked = [], buildings = {}, categories = {}, queue = [] } = researchData || {};
  const activeResearch = queue.find(item => item.status === 'in_progress');
  const queuedResearch = queue.filter(item => item.status === 'queued');

  // Créer un tableau avec toutes les recherches et leur statut
  // Tri intelligent : Tier (1→4), puis par statut (available → locked → completed)
  const statusPriority = { available: 1, locked: 2, inProgress: 3, completed: 4 };
  
  const allResearch = [
    ...completed.map(r => ({ ...r, status: 'completed' })),
    ...inProgress.map(r => ({ ...r, status: 'inProgress' })),
    ...available.map(r => ({ ...r, status: 'available' })),
    ...locked.map(r => ({ ...r, status: 'locked' }))
  ].sort((a, b) => {
    // Tri par Tier d'abord (recherches simples en premier)
    if (a.tier !== b.tier) return a.tier - b.tier;
    // Puis par statut (available avant locked)
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    // Puis alphabétique
    return a.name.localeCompare(b.name);
  });

  const filteredResearch = allResearch;

  const researchLabLevel = buildings.researchLab || 0;

  return (
    <div className="research-container">
      <Menu />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="research-content" id="main-content">
        <ResourcesWidget />

        <div className="unit-training-header">
          <div className="header-title">
            <FlaskConical size={32} />
            <h1>Recherches & Technologies</h1>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Award size={20} />
              <span>Labo Niv {researchLabLevel}</span>
            </div>
            <div className="stat-badge">
              <CheckCircle size={20} />
              <span>{completed.length} Complétées</span>
            </div>
            <div className="stat-badge">
              <Clock size={20} />
              <span>{inProgress.length} En cours</span>
            </div>
            <div className="stat-badge">
              <FlaskConical size={20} />
              <span>{available.length} Disponibles</span>
            </div>
          </div>
        </div>

        {/* Research Grid */}
        <div className="research-grid">
          {filteredResearch.map(research => {
            const getTier = (category) => {
              if (category === 'Militaire') return 4;
              if (category === 'Défense') return 3;
              if (category === 'Économie') return 2;
              return 1;
            };

            const statusIcons = {
              completed: '✅',
              inProgress: '🛠️',
              available: '🔬',
              locked: '🔒'
            };

            return (
              <PremiumCard
                key={research.id}
                title={research.name}
                image={research.icon ? `/images/research/${research.icon}` : `/images/research/${research.name.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '')}.png`}
                description={research.description}
                tier={getTier(research.category)}
                badge={statusIcons[research.status] || '🔬'}
                isLocked={research.status === 'locked'}
                lockReason={research.missingRequirements?.join(', ') || 'Verrouillée'}
                isInProgress={research.status === 'inProgress'}
                stats={research.effects || {}}
                cost={research.cost || {}}
                onClick={() => handleResearchSelect(research)}
                onAction={() => handleStartResearch(research)}
                actionLabel={research.status === 'completed' ? 'Terminée' : (research.status === 'inProgress' ? 'En cours...' : 'Lancer')}
              />
            );
          })}
        </div>

        {filteredResearch.length === 0 && (
          <div className="empty-state">
            <Lock size={48} />
            <p>Aucune recherche dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchUnified;
