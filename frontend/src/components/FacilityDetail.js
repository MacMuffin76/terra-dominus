// frontend/src/components/FacilityDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './FacilityDetail.css';
import { useResources } from '../context/ResourcesContext';

// Formate un taux (si un jour tu as des valeurs /s sur les facilities)
const formatRate = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
};

// Formate un montant de ressource (ENTIER + séparateur de milliers)
const formatAmount = (value) => {
  const n = Math.floor(Number(value) || 0);
  return n.toLocaleString('fr-FR');
};

const FacilityDetail = ({
  facility,
  onFacilityUpgraded,
  onFacilityDowngraded,
}) => {
  const [detail, setDetail] = useState(null);
  const { resources, setResources } = useResources();

  const refreshFacility = async () => {
    const { data } = await axiosInstance.get(
      `/facilities/facility-buildings/${facility.id}`
    );
    setDetail(data);
  };

  useEffect(() => {
    refreshFacility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility.id]);

  const handleUpgrade = async () => {
    if (!detail) return;

    try {
      const { data } = await axiosInstance.post(
        `/facilities/facility-buildings/${facility.id}/upgrade`
      );

      if (data.message) {
        alert(data.message);
      } else {
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
        localStorage.setItem(
          'resourcesData',
          JSON.stringify(updatedResources)
        );
      }

      await refreshFacility();
      onFacilityUpgraded && onFacilityUpgraded(detail);
    } catch (err) {
      console.error('Erreur upgrade facility:', err);
      alert(err.response?.data?.message || "Erreur lors de l’amélioration");
    }
  };

  const handleDowngrade = async () => {
    try {
      await axiosInstance.post(
        `/facilities/facility-buildings/${facility.id}/downgrade`
      );
      await refreshFacility();
      onFacilityDowngraded && onFacilityDowngraded(detail);
    } catch (err) {
      console.error('Erreur downgrade facility:', err);
      alert(err.response?.data?.message || 'Erreur lors du rétrogradage');
    }
  };

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
      className="facility-detail"
      style={{
        backgroundImage: `url(/images/facilities/${bgName}.png)`,
      }}
    >
      <div className="facility-detail-header">
        <h2>{detail.name.toUpperCase()}</h2>
        <div className="facility-detail-subtitle">
          NIVEAU {detail.level}
        </div>
      </div>

      <div className="facility-stats">
        <div className="facility-stat-block">
          <h4>Niveau actuel :</h4>
          <p className="facility-stat-value-large">{detail.level}</p>
        </div>

        <div className="facility-stat-block">
          <h4>Description :</h4>
          <p className="facility-stat-value">
            {detail.description || 'Aucune description'}
          </p>
        </div>

        <div className="facility-stat-block">
          <h4>Durée de construction :</h4>
          <p className="facility-stat-value">
            {formatAmount(detail.buildDuration)} secondes
          </p>
        </div>

        <div className="facility-stat-block">
          <h4>Statut :</h4>
          <p className="facility-stat-value">
            {detail.inProgress ? 'Construction en cours' : 'Disponible'}
          </p>
        </div>
      </div>

      <div className="facility-cost-section">
        <h3>Coût pour le niveau {nextLevel} :</h3>
        <ul className="facility-resource-costs">
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
                className={`facility-cost-item ${
                  enough ? 'enough' : 'not-enough'
                }`}
              >
                <span className="facility-cost-resource">
                  {cost.resource_type.toUpperCase()}
                </span>
                <span className="facility-cost-values">
                  <span className="facility-cost-required">
                    {formatAmount(needed)}
                  </span>
                  <span className="facility-cost-owned">
                    / {formatAmount(ownedAmount)} dispo
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="facility-buttons">
        <button
          onClick={handleUpgrade}
          disabled={detail.inProgress}
          className="facility-btn-upgrade"
        >
          Améliorer
        </button>
        <button
          onClick={handleDowngrade}
          className="facility-btn-downgrade"
        >
          Rétrograder
        </button>
      </div>
    </div>
  );
};

export default FacilityDetail;
