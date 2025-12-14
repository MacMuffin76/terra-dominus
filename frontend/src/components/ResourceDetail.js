// frontend/src/components/ResourceDetail.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './ResourceDetail.css';
import { useResources } from '../context/ResourcesContext';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { safeStorage } from '../utils/safeStorage';
import { logger } from '../utils/logger';
import PropTypes from 'prop-types';
import { Button, Loader } from './ui';
import axiosInstance from '../utils/axiosInstance';
import {
  downgradeResourceBuilding,
  getResourceBuildingDetail,
  upgradeResourceBuilding,
} from '../api/resourceBuildings';

const buildingToResourceType = {
  "Mine d'or": 'or',
  'Mine de métal': 'metal',
  Extracteur: 'carburant',
  'Centrale électrique': 'energie',
};

// Formate un taux de production sur 2 décimales
const formatRate = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
};

// Formate un montant de ressource (ENTIER + séparateur de milliers)
const formatAmount = (value) => {
  const n = Math.floor(Number(value) || 0); // 🔹 on force un entier
  return n.toLocaleString('fr-FR');
};

// Formate une durée en secondes vers l'unité la plus appropriée
const formatDuration = (seconds) => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return '0 seconde';
  
  const weeks = Math.floor(n / (7 * 24 * 3600));
  const days = Math.floor(n / (24 * 3600));
  const hours = Math.floor(n / 3600);
  const minutes = Math.floor(n / 60);
  
  // Semaines (si >= 7 jours)
  if (weeks >= 1) {
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    return `${weeks} semaine${weeks > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
  }
  
  // Jours (si >= 1 jour)
  if (days >= 1) {
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours}h`;
  }
  
  // Heures (si >= 1 heure)
  if (hours >= 1) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }
  
  // Minutes (si >= 1 minute)
  if (minutes >= 1) {
    const remainingSeconds = n % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes}min ${remainingSeconds}s`;
  }
  
  // Secondes
  return `${n} seconde${n > 1 ? 's' : ''}`;
};

const ResourceDetail = ({
  building,
  onBuildingUpgraded,
  onBuildingDowngraded,
  onClose,
}) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [error, setError] = useState(null);
  const { resources, setResources } = useResources(); // ✅ objet et plus tableau

  const isBuilding = useMemo(
    () => detail?.status === 'building',
    [detail?.status]
  );

  const formatRemaining = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--:--';
    const safeSeconds = Math.max(0, seconds);
    const hrs = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(safeSeconds % 60).padStart(2, '0');

    return `${hrs}:${mins}:${secs}`;
  };

  const refreshBuilding = useCallback(async (signal, { silent = false } = {}) => {
    if (!building || !building.id) return null;

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getResourceBuildingDetail(building.id, signal);

      if (!data) return null;

      setDetail(data);

      if (data.isUnderConstruction && data.remainingSeconds) {
        setRemainingSeconds(data.remainingSeconds);
      } else {
        setRemainingSeconds(null);
      }

      if (data.resources) {
        setResources((prevResources) => {
          const updatedResources = prevResources.map((res) => {
            const updated = data.resources.find((r) => r.type === res.type);
            return updated ? { ...res, ...updated } : res;
          });

          safeStorage.setItem('resources', JSON.stringify(updatedResources));
          return updatedResources;
        });
      }

      return data;
    } catch (err) {
      if (err.name === 'CanceledError') return null;

      logger.error('ResourceDetail', 'Error refreshing building', { buildingId: building?.id, error: err });
      setError(getApiErrorMessage(err, 'Erreur lors du chargement'));
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [building, setResources]);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      // 🎮 Style Ogame : Ne PAS synchroniser à l'ouverture
      // On charge juste les détails rapidement (pas de clignotement)
      // La synchronisation se fera au moment de l'upgrade
      try {
        await refreshBuilding(controller.signal);
      } catch (err) {
        // Erreurs déjà gérées dans refreshBuilding
      }
    };
    
    loadData();
    return () => controller.abort();
  }, [building.id]); // ✅ Retirer refreshBuilding des dépendances pour éviter la boucle

  const handleUpgrade = async () => {
    try {
      // 🎮 Style Ogame : Le backend recalcule AUTOMATIQUEMENT les ressources
      // Pas besoin de synchroniser manuellement, upgradeResourceBuilding le fait
      const upgradeData = await upgradeResourceBuilding(building.id);

      if (!upgradeData || !detail) {
        await refreshBuilding();
        return;
      }

      // ✅ IMPORTANT : Récupérer les vraies ressources depuis le backend après l'upgrade
      // Le backend a recalculé la production + déduit les coûts
      try {
        const freshResourcesResponse = await axiosInstance.get('/resources/user-resources');
        if (freshResourcesResponse.data) {
          const freshResources = Array.isArray(freshResourcesResponse.data)
            ? freshResourcesResponse.data
            : freshResourcesResponse.data.resources || [];
          
          setResources(freshResources);
          safeStorage.setItem('resourcesData', JSON.stringify(freshResources));
          
          // Synchroniser le localStorage avec les vraies valeurs du serveur
          const resourcesObj = freshResources.reduce((acc, r) => {
            acc[r.type] = r.amount;
            return acc;
          }, {});
          localStorage.setItem('localResources', JSON.stringify(resourcesObj));
          
          console.log('✅ Ressources synchronisées après upgrade:', resourcesObj);
        }
      } catch (syncErr) {
        console.warn('⚠️ Échec de la récupération des ressources:', syncErr);
      }

      const updatedDetail = await refreshBuilding();
      if (updatedDetail) {
        onBuildingUpgraded(updatedDetail);
      }
      // ✅ Fermer automatiquement le modal après l'amélioration
      if (onClose) {
        onClose();
      }
      if (upgradeData.message && upgradeData.status !== 'building') {
        alert(upgradeData.message);
      }
    } catch (err) {
      const message = getApiErrorMessage(err, "Erreur lors de l’amélioration");
      alert(message);
    }
  };

  const handleDowngrade = async () => {
    try {
      await downgradeResourceBuilding(building.id);
      const updatedDetail = await refreshBuilding();
      if (updatedDetail) {
        onBuildingDowngraded(updatedDetail);
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erreur lors du rétrogradage');
      alert(message);
    }
  };

  useEffect(() => {
    console.log('[ResourceDetail] detail changed:', {
      status: detail?.status,
      constructionEndsAt: detail?.constructionEndsAt,
      remainingTime: detail?.remainingTime,
      isBuilding
    });
    
    if (!detail?.constructionEndsAt) {
      setRemainingSeconds(null);
      return undefined;
    }

    const end = new Date(detail.constructionEndsAt).getTime();
    console.log('[ResourceDetail] Setting up timer, end:', new Date(end), 'now:', new Date());
    
    const updateRemaining = () => {
      const diffSeconds = Math.ceil((end - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, diffSeconds));
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [detail?.constructionEndsAt]);

  useEffect(() => {
    if (isBuilding && remainingSeconds === 0) {
      const refresh = async () => {
        try {
          await refreshBuilding();
        } catch (err) {
          // Erreur déjà gérée
        }
      };
      refresh();
    }
  }, [isBuilding, remainingSeconds]);

  useEffect(() => {
    if (!isBuilding) return undefined;

    const intervalId = setInterval(async () => {
      try {
        await refreshBuilding(undefined, { silent: true });
      } catch (err) {
        // Erreur déjà gérée
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isBuilding]);

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (error) {
    return (
      <div className="resource-detail resource-detail-error">
        <p>{error}</p>
        <Button onClick={() => refreshBuilding().catch(() => {})} variant="secondary">
          Réessayer
        </Button>
      </div>
    );
  }

  if (!detail) return <p>Chargement…</p>;

  const bgName = detail.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_');

  const nextLevel = detail.level + 1;
  const costList = detail.nextLevelCost || [];

  return (
    <div
      className="resource-detail"
      style={{
        backgroundImage: `url(/images/buildings/${bgName}.png)`,
      }}
    >
      <div className="resource-detail-header">
        <h2>{detail.name.toUpperCase()}</h2>
        <div className="resource-detail-subtitle">
          NIVEAU {detail.level}
        </div>

        {isBuilding && (
          <div className="resource-detail-status" aria-live="polite">
            <span className="badge badge-building">Construction en cours</span>
            <div className="timer-wrapper">
              <Loader size="sm" label="" />
              <span className="timer-value">
                Fin dans : {formatRemaining(remainingSeconds)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="building-stats">
        <div className="stat-block">
          <h4>Niveau actuel :</h4>
          <p className="stat-value-large">{detail.level}</p>
        </div>

        {/* Pour les bâtiments de stockage et centrales : afficher "Capacité" au lieu de "Production" */}
        {(detail.name === 'Hangar' || detail.name === 'Réservoir' || detail.name === 'Centrale électrique') ? (
          <>
            <div className="stat-block">
              <h4>Capacité actuelle :</h4>
              <p className="stat-value">
                {detail.storage_capacity && detail.name === 'Hangar' && (
                  <>
                    {formatAmount(detail.storage_capacity.or)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>or / métal</span>
                  </>
                )}
                {detail.storage_capacity && detail.name === 'Réservoir' && (
                  <>
                    {formatAmount(detail.storage_capacity.carburant)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>carburant</span>
                  </>
                )}
                {detail.storage_capacity && detail.name === 'Centrale électrique' && (
                  <>
                    {formatAmount(detail.storage_capacity.energie)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>énergie</span>
                  </>
                )}
                {!detail.storage_capacity && formatAmount(Math.floor(detail.production_rate))}
              </p>
            </div>

            <div className="stat-block">
              <h4>Capacité niveau suivant :</h4>
              <p className="stat-value highlight">
                {detail.next_storage_capacity && detail.name === 'Hangar' && (
                  <>
                    {formatAmount(detail.next_storage_capacity.or)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>or / métal</span>
                  </>
                )}
                {detail.next_storage_capacity && detail.name === 'Réservoir' && (
                  <>
                    {formatAmount(detail.next_storage_capacity.carburant)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>carburant</span>
                  </>
                )}
                {detail.next_storage_capacity && detail.name === 'Centrale électrique' && (
                  <>
                    {formatAmount(detail.next_storage_capacity.energie)}<br/>
                    <span style={{fontSize: '12px', opacity: 0.8}}>énergie</span>
                  </>
                )}
                {!detail.next_storage_capacity && formatAmount(Math.floor(detail.next_production_rate))}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="stat-block">
              <h4>Production actuelle :</h4>
              <p className="stat-value">
                {formatAmount(Math.floor(detail.production_rate * 3600))} / heure
              </p>
            </div>

            <div className="stat-block">
              <h4>Production niveau suivant :</h4>
              <p className="stat-value highlight">
                {formatAmount(Math.floor(detail.next_production_rate * 3600))} / heure
              </p>
            </div>
          </>
        )}

        <div className="stat-block">
          <h4>Durée de construction :</h4>
          <p className="stat-value">
            {formatDuration(detail.buildDuration)}
          </p>
        </div>
      </div>

      <div className="cost-section">
        <h3>Coût pour le niveau {nextLevel} :</h3>
        <ul className="resource-costs">
          {costList.map((cost) => {
            const owned = resources.find(
              (r) => r.type === cost.resource_type
            );
            const ownedAmount = owned ? Number(owned.amount) || 0 : 0;
            const needed = Number(cost.amount) || 0;
            const enough = ownedAmount >= needed;

            return (
              <li
                key={cost.resource_type}
                className={`cost-item ${enough ? 'enough' : 'not-enough'}`}
              >
                <span className="cost-resource">
                  {cost.resource_type.toUpperCase()}
                </span>
                <span className="cost-values">
                  <span className="cost-required">
                    {formatAmount(needed)}
                  </span>
                  <span className="cost-owned">
                    / {formatAmount(ownedAmount)} dispo
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="buttons">
        <Button
          onClick={handleUpgrade}
          disabled={isBuilding}
          variant="danger"
          size="lg"
        >
          Améliorer
        </Button>
        <Button onClick={handleDowngrade} variant="secondary" size="lg">
          Rétrograder
        </Button>
      </div>
    </div>
  );
};

ResourceDetail.propTypes = {
  building: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    level: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onBuildingUpgraded: PropTypes.func.isRequired,
  onBuildingDowngraded: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export default ResourceDetail;
