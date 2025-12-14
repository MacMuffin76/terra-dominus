// frontend/src/components/ResearchDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './ResearchDetail.css';
import { useResources } from '../context/ResourcesContext';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { safeStorage } from '../utils/safeStorage';
import { Button } from './ui';


// Formate un montant de ressource (ENTIER + séparateur de milliers)
const formatAmount = (value) => {
  const n = Math.floor(Number(value) || 0);
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

const ResearchDetail = ({ research, onResearchUpgraded, onResearchDestroyed, onClose }) => {
  const [detail, setDetail] = useState(null);
  const { resources, setResources } = useResources();

  // 🔹 Récupère les détails de la recherche
  const refreshResearch = async () => {
    try {
      // 👉 route backend correcte : /research/research-items/:id
      const { data } = await axiosInstance.get(
        `/research/research-items/${research.id}`
      );
      setDetail(data);
    } catch (error) {
      getApiErrorMessage(error, 'Impossible de récupérer cette recherche.');
    }
  };

  useEffect(() => {
    refreshResearch();
  }, [research.id]);

  // 🔹 Amélioration
  const handleUpgrade = async () => {
    if (!detail) return;

    try {
      const { data } = await axiosInstance.post(
        `/research/research-items/${research.id}/upgrade`
      );

      if (data.message) {
        alert(data.message);
      } else {
        // Déduction visuelle des ressources
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

      await refreshResearch();
      onResearchUpgraded && onResearchUpgraded(detail);      
      // ✅ Fermer automatiquement le modal après l'amélioration
      if (onClose) {
        onClose();
      }    } catch (err) {
      const message = getApiErrorMessage(err, "Erreur lors de l’amélioration");
      alert(message);
    }
  };

  // 🔹 Destruction (le backend a /destroy, pas de /downgrade)
  const handleDestroy = async () => {
    try {
      await axiosInstance.post(
        `/research/research-items/${research.id}/destroy`
      );
      onResearchDestroyed && onResearchDestroyed(detail);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Erreur lors de la destruction');
      alert(message);
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
  const buildDuration = detail.buildDuration || detail.build_duration;

  return (
    <div
      className="research-detail"
      style={{
        backgroundImage: `url(/images/researches/${bgName}.png)`,
      }}
    >
      <div className="research-detail-header">
        <h2>{detail.name.toUpperCase()}</h2>
        <div className="research-detail-subtitle">
          NIVEAU {detail.level}
        </div>
      </div>

      <div className="research-stats">
        <div className="research-stat-block">
          <h4>Niveau actuel :</h4>
          <p className="research-stat-value-large">{detail.level}</p>
        </div>

        <div className="research-stat-block research-stat-description">
          <h4>Description :</h4>
          <p className="research-stat-value">
            {detail.description || 'Aucune description'}
          </p>
        </div>

        <div className="research-stat-block">
          <h4>Durée de recherche :</h4>
          <p className="research-stat-value">
            {buildDuration
              ? formatDuration(buildDuration)
              : 'Instantanée'}
          </p>
        </div>

        <div className="research-stat-block">
          <h4>Statut :</h4>
          <p className="research-stat-value">
            {detail.inProgress ? 'Recherche en cours' : 'Disponible'}
          </p>
        </div>
      </div>

      <div className="research-cost-section">
        <h3>Coût pour le niveau {nextLevel} :</h3>
        <ul className="research-resource-costs">
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
                className={`research-cost-item ${
                  enough ? 'enough' : 'not-enough'
                }`}
              >
                <span className="research-cost-resource">
                  {cost.resource_type.toUpperCase()}
                </span>
                <span className="research-cost-values">
                  <span className="research-cost-required">
                    {formatAmount(needed)}
                  </span>
                  <span className="research-cost-owned">
                    / {formatAmount(ownedAmount)} dispo
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="research-buttons">
        <Button
          onClick={handleUpgrade}
          disabled={detail.inProgress}
          variant="primary"
          size="lg"
        >
          Améliorer
        </Button>
        <Button onClick={handleDestroy} variant="secondary" size="lg">
          Détruire
        </Button>
      </div>
    </div>
  );
};

export default ResearchDetail;