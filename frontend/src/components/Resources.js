import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import './Resources.css';
import ResourceDetail from './ResourceDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Skeleton } from './ui';
import {
  getAllowedResourceBuildings,
  getResourceBuildings,
} from '../api/resourceBuildings';

const Resources = () => {
  const [data, setData] = useState([]);
  const [selectedBuilding, setSel] = useState(null);
  const [allowedBuildings, setAllowedBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const orderBuildings = useCallback(
    (list, allowed) => allowed.map(n => list.find(b => b.name === n)).filter(Boolean),
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allowed, buildings] = await Promise.all([
        getAllowedResourceBuildings(),
        getResourceBuildings(),
      ]);

      setAllowedBuildings(allowed);
      const filtered = buildings.filter(b => allowed.includes(b.name));
      setData(orderBuildings(filtered, allowed));
    } catch (err) {
      console.error('Error fetching resource buildings:', err);
      setError("Une erreur est survenue lors du chargement des bâtiments.");
    } finally {
      setLoading(false);
    }
  }, [orderBuildings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const cardData = loading ? Array.from({ length: 6 }) : data;

  const renderBuildingCard = (building, index) => {
    if (!building) {
      return (
        <button
          type="button"
          key={`res-skeleton-${index}`}
          className="building-card"
          aria-busy="true"
          disabled
        >
          <Skeleton width="100%" height="200px" />
          <h3>
            <Skeleton width="70%" />
          </h3>
          <p>
            <Skeleton width="50%" />
          </p>
        </button>
      );
    }

    const isSelected = selectedBuilding?.id === building.id;

    return (
      <button
        type="button"
        key={building.id}
        className={`building-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleClick(building)}
        aria-pressed={isSelected}
        aria-label={`${building.name}, niveau ${building.level}`}
      >
        <img
          src={`/images/buildings/${fmt(building.name)}.png`}
          alt={building.name}
          className="building-image"
        />
        <h3>{building.name}</h3>
        <p>{`Level: ${building.level}`}</p>
      </button>
    );
  };

  const firstRow = cardData.slice(0, 3);
  const secondRow = cardData.slice(3, 6);
  return (
    <div className="resources-container">
      <Menu />
      <ResourcesWidget />
      <div
        className={`resources-content ${selectedBuilding ? 'with-details' : ''}`}
        id="main-content"
      >
        <h1>Ressources</h1>

        <div className="resources-status">
          {loading && <Loader label="Chargement des bâtiments" />}
          {error && (
            <Alert
              type="error"
              title="Bâtiments de ressources"
              message={error}
              onAction={fetchData}
              actionLabel="Réessayer"
            />
          )}
        </div>

        {selectedBuilding && (
          <ResourceDetail
            building={selectedBuilding}
            onBuildingUpgraded={handleUp}
            onBuildingDowngraded={handleDown}
          />
        )}

        <div className="resources-list">
          <div className="resources-row">
            {firstRow.map((building, index) => renderBuildingCard(building, index))}
          </div>
          <div className="resources-row">
            {secondRow.map((building, index) => renderBuildingCard(building, index + firstRow.length))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;