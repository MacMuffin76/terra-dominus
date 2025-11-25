// frontend/src/components/Defense.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Defense.css';
import DefenseDetail from './DefenseDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Skeleton } from './ui';

const Defense = () => {
  const [data, setData] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/defense/defenses');
      // On prend toutes les défenses renvoyées par l'API, sans filtre
      setData(response.data);
    } catch (err) {
      console.error('Error fetching defense buildings:', err);
      setError('Erreur lors du chargement des défenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDefenseClick = (def) => {
    if (selectedDefense && selectedDefense.id === def.id) {
      setSelectedDefense(null);
    } else {
      setSelectedDefense(def);
    }
  };

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  return (
    <div className="defense-container">
      <Menu />
      <ResourcesWidget />
      <div
        className={`defense-content ${selectedDefense ? 'with-details' : ''}`}
        id="main-content"
      >
        <h1>Défenses</h1>
        {loading && <Loader label="Chargement des défenses" />}
        {error && (
          <Alert
            type="error"
            title="Défenses"
            message={error}
            onAction={fetchData}
          />
        )}

        {selectedDefense && <DefenseDetail defense={selectedDefense} />}

        <div className="defense-list">
          {(loading ? Array.from({ length: 4 }) : data).map((def, idx) => (
            <button
              type="button"
              key={def?.id || `defense-skeleton-${idx}`}
              className={`defense-card ${selectedDefense?.id === def?.id ? 'selected' : ''}`}
              onClick={() => def && handleDefenseClick(def)}
              aria-pressed={selectedDefense?.id === def?.id}
              aria-label={def ? `${def.name}, quantité ${def.quantity}` : 'Chargement des défenses'}
              disabled={!def}
            >
              {loading ? (
                <Skeleton width="100%" height="160px" />
              ) : (
                <img
                  src={`/images/defense/${formatFileName(def.name)}.png`}
                  alt={def.name}
                  className="defense-image"
                />
              )}
              <h3>{loading ? <Skeleton width="60%" /> : def.name}</h3>
              <p>{loading ? <Skeleton width="50%" /> : `Quantité: ${def.quantity}`}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Defense;