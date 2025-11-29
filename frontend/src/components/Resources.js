import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import { useAsyncError } from '../hooks/useAsyncError';
import './Resources.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader } from './ui';
import BuildingCard from './resources/BuildingCard';
import ResourceDetail from './ResourceDetail';
import {
  getAllowedResourceBuildings,
  getResourceBuildings,
} from '../api/resourceBuildings';

const Resources = () => {
  const { error, catchError, clearError } = useAsyncError('Resources');
  const [data, setData] = useState([]);
  const [selectedBuilding, setSel] = useState(null);
  const [allowedBuildings, setAllowedBuildings] = useState([]);
  const [loading, setLoading] = useState(false);

  const orderBuildings = (list, allowed) => 
    allowed.map(n => list.find(b => b.name === n)).filter(Boolean);

  const fetchData = async () => {
    setLoading(true);
    clearError();
    
    try {
      const [allowed, buildings] = await Promise.all([
        getAllowedResourceBuildings(),
        getResourceBuildings(),
      ]);
      
      setAllowedBuildings(allowed);
      const filtered = buildings.filter(b => allowed.includes(b.name));
      setData(orderBuildings(filtered, allowed));
    } catch (err) {
      catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {}); // Ignorer le re-throw
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = b => setSel(prev => prev?.id === b.id ? null : b);
  const handleUp = updated => handleUpdate(updated);
  const handleDown = updated => handleUpdate(updated);

  const handleUpdate = updated => {
    const upd = data.map(b => b.id === updated.id ? updated : b);
    const ordered = orderBuildings(upd, allowedBuildings);
    setData(ordered);
    setSel(updated);
  };

  const fmt = name => name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_');



  return (
    <div className="resources-container">
      <Menu />
      <div className="resources-content" id="main-content">
        <ResourcesWidget />
        <div className="resources-header">
          <h1 className="resources-title">💎 RESSOURCES</h1>
        </div>

        {loading && <Loader label="Chargement des ressources..." />}
        
        {error && (
          <Alert
            type="error"
            title="Bâtiments de ressources"
            message={error}
            onAction={fetchData}
            actionLabel="Réessayer"
          />
        )}

        <div className="resources-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <BuildingCard key={`skeleton-${idx}`} loading={true} />
            ))
          ) : data.length > 0 ? (
            data.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                isSelected={selectedBuilding?.id === building.id}
                onClick={handleClick}
              />
            ))
          ) : (
            !error && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>Aucun bâtiment de ressources disponible</p>
              </div>
            )
          )}
        </div>

        {selectedBuilding && (
          <ResourceDetail
            building={selectedBuilding}
            onBuildingUpgraded={handleUp}
            onBuildingDowngraded={handleDown}
          />
        )}
      </div>
    </div>
  );
};

export default Resources;