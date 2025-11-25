// frontend/src/components/Fleet.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Fleet.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Skeleton } from './ui';

const Fleet = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get('/api/units');
      setUnits(data);
    } catch (err) {
      console.error('Error fetching units:', err);
      setUnits([]);
      setError('Impossible de charger la flotte.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  return (
    <div className="fleet-container">
      <Menu />
      <ResourcesWidget />
      <div className="fleet-content" id="main-content">
        <h1>Flotte</h1>
        {loading && <Loader label="Chargement de la flotte" />}
        {error && (
          <Alert
            type="error"
            title="Flotte"
            message={error}
            onAction={fetchUnits}
          />
        )}
        <div className="fleet-list">
          {(loading ? Array.from({ length: 4 }) : units).map((u, idx) => (
            <div key={u?.id || `unit-skeleton-${idx}`} className="unit-card">
              {loading ? (
                <Skeleton width="100%" height="160px" />
              ) : (
                <img
                  src={`/images/training/${formatFileName(u.name)}.png`}
                  alt={u.name}
                  className="unit-image"
                />
              )}
              <h3>{loading ? <Skeleton width="60%" /> : u.name}</h3>
              <p>{loading ? <Skeleton width="40%" /> : `Quantité : ${u.quantity}`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fleet;