// frontend/src/components/ResourcesWidget.js

import React, { useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useResources } from '../context/ResourcesContext';
import './ResourcesWidget.css';

const ResourcesWidget = () => {
  const { resources, setResources } = useResources();

  const humanize = (type) =>
    type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    let intervalId;
    let lastTick = Date.now();

    // Chargement initial : récupère les ressources calculées par le backend
    const fetchResources = async () => {
      try {
        const { data } = await axiosInstance.get('/resources/user-resources');

        const normalized = data.map((r) => ({
          ...r,
          amount: Number(r.amount) || 0,
          production_rate: Number(r.production_rate) || 0,
        }));

        setResources(normalized);
        localStorage.setItem('resourcesData', JSON.stringify(normalized));
        lastTick = Date.now();
      } catch (err) {
        console.error('Error fetching resources:', err);
      }
    };

    fetchResources();

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

        localStorage.setItem('resourcesData', JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    // Nettoyage
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [setResources]);

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
