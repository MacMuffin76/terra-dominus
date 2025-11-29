// frontend/src/components/Fleet.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './Fleet.css';
import ResourcesWidget from './ResourcesWidget';
import FleetCard from './fleet/FleetCard';
import { Alert, Loader } from './ui';

const Fleet = () => {
  const { error, catchError } = useAsyncError('Fleet');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/units');
      setUnits(data);
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

  return (
    <div className="fleet-container">
      <Menu />
      <div className="fleet-content" id="main-content">
        <ResourcesWidget />
        <div className="fleet-header">
          <h1 className="fleet-title">Flotte</h1>
        </div>
        {loading && <Loader label="Chargement de la flotte" />}
        {error && (
          <Alert
            type="error"
            title="Flotte"
            message={error}
            onAction={fetchUnits}
          />
        )}
        <div className="fleet-grid">
          {(loading ? Array.from({ length: 4 }) : units).map((u, idx) => (
            <FleetCard
              key={u?.id || `unit-skeleton-${idx}`}
              unit={u}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fleet;