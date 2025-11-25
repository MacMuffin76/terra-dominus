// frontend/src/components/ResourceDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './ResourceDetail.css';
import { useResources } from '../context/ResourcesContext';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { safeStorage } from '../utils/safeStorage';
import PropTypes from 'prop-types';
import { Button } from './ui';


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

const ResourceDetail = ({
  building,
  onBuildingUpgraded,
  onBuildingDowngraded,
}) => {
   const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { resources, setResources } = useResources();

  const refreshBuilding = async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosInstance.get(
        `/resources/resource-buildings/${building.id}`,
        { signal }
      );
      setDetail(data);

      const resType = buildingToResourceType[building.name];

      if (resType) {
        const updated = resources.map((r) =>
          r.type === resType
            ? {
                ...r,
                level: Number(data.level) || 0,
              }
            : r
        );
        setResources(updated);
        safeStorage.setItem('resourcesData', JSON.stringify(updated));
      }
    } catch (err) {
      if (err.name === 'CanceledError') return;
      setError(err.message || "Impossible de charger les détails du bâtiment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshBuilding(controller.signal);

    return () => controller.abort();
  }, [building.id]);

  const handleUpgrade = async () => {
    try {
      const { data } = await axiosInstance.post(
        `/resources/resource-buildings/${building.id}/upgrade`
      );

      if (data.message) {
        alert(data.message);
      } else if (detail) {
        // Déduction des ressources côté front (visuel)
        const costList = detail.nextLevelCost || [];
        const updatedResources = resources.map((r) => {
          const cost = costList.find((c) => c.resource_type === r.type);
          if (cost) {
            const baseAmount = Number(r.amount) || 0;
            return {
              ...r,
              amount: baseAmount - Number(cost.amount || 0),
            };
          }
          return r;
        });
        setResources(updatedResources);
        safeStorage.setItem(
          'resourcesData',
          JSON.stringify(updatedResources)
        );
      }

      await refreshBuilding();
      onBuildingUpgraded(detail);
    } catch (err) {
      const message = getApiErrorMessage(err, "Erreur lors de l’amélioration");
      alert(message);
    }
  };


  const handleDowngrade = async () => {
    try {
      await axiosInstance.post(
        `/resources/resource-buildings/${building.id}/downgrade`
      );
      await refreshBuilding();
      onBuildingDowngraded(detail);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erreur lors du rétrogradage');
      alert(message);
    }
  };

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (error) {
    return (
      <div className="resource-detail resource-detail-error">
        <p>{error}</p>
        <Button onClick={() => refreshBuilding()} variant="secondary">
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
      </div>

      <div className="building-stats">
        <div className="stat-block">
          <h4>Niveau actuel :</h4>
          <p className="stat-value-large">{detail.level}</p>
        </div>

        <div className="stat-block">
          <h4>Production actuelle :</h4>
          <p className="stat-value">
            {formatRate(detail.production_rate)} / seconde
          </p>
        </div>

        <div className="stat-block">
          <h4>Production niveau suivant :</h4>
          <p className="stat-value highlight">
            {formatRate(detail.next_production_rate)} / seconde
          </p>
        </div>

        <div className="stat-block">
          <h4>Durée de construction :</h4>
          <p className="stat-value">
            {formatAmount(detail.buildDuration)} secondes
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
          disabled={detail.inProgress}
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
};

export default ResourceDetail;
