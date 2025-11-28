// frontend/src/components/ResourcesWidget.js

import React, { useEffect } from 'react';
import { useResources } from '../context/ResourcesContext';
import './ResourcesWidget.css';
import { safeStorage } from '../utils/safeStorage';

const ResourcesWidget = () => {
  const { resources, setResources } = useResources();

  const humanize = (type) =>
    type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    let intervalId;
    let lastTick = Date.now();

    // Intervalle d'affichage : incrémente visuellement toutes les secondes
    intervalId = setInterval(() => {
      setResources((prev) => {
        const now = Date.now();
        const deltaSec = (now - lastTick) / 1000;
        lastTick = now;

        const updated = prev.map((r) => {
          const rate = Number(r.production_rate) || 0;
          const currentAmount = Number(r.amount) || 0;
          const newAmount = currentAmount + rate * deltaSec;

          return {
            ...r,
            amount: newAmount,
          };
        });

        safeStorage.setItem('resourcesData', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    // Nettoyage
    return () => {
      if (intervalId) clearInterval(intervalId);
    };

    // On veut que cet effet ne tourne qu'une seule fois au montage.
    // Le contexte se charge déjà de rafraîchir les ressources via l'API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!resources || resources.length === 0) {
    return (
      <div className="resources-widget">
        <span>Chargement des ressources...</span>
      </div>
    );
  }

  return (
    <div className="resources-widget">
      {resources.map((r) => (
        <div key={r.type} className="resource-item">
          <img
            src={`/images/resources/${r.type.toLowerCase()}.png`}
            alt={r.type}
          />
          {humanize(r.type)}:{' '}
          {Math.floor(Number(r.amount) || 0)}
        </div>
      ))}
    </div>
  );
};

export default ResourcesWidget;
