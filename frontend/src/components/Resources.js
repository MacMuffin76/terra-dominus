import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Resources.css';
import ResourceDetail from './ResourceDetail';
import ResourcesWidget from './ResourcesWidget';
import { useResources } from '../context/ResourcesContext';

const Resources = () => {
  const [data, setData] = useState([]);
  const [selectedBuilding, setSel] = useState(null);
  const { resources } = useResources();

  const allowedBuildings = [
    "Mine d'or",
    'Mine de métal',
    'Extracteur',
    'Centrale électrique',
    'Hangar',
    'Réservoir'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: buildings } = await axiosInstance.get('/resources/resource-buildings');
        const filtered = buildings.filter(b => allowedBuildings.includes(b.name));
        setData(filtered);
      } catch (err) {
        console.error('Error fetching resource buildings:', err);
        setData([]);
      }
    };
    fetchData();
  }, []);

  const handleClick = b => setSel(prev => prev?.id === b.id ? null : b);
  const handleUp = updated => {
    const upd = data.map(b => b.id === updated.id ? updated : b);
    setData(upd);
    setSel(updated);
  };
  const handleDown = updated => {
    const upd = data.map(b => b.id === updated.id ? updated : b);
    setData(upd);
    setSel(updated);
  };

  const fmt = name => name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_');

  const ordered = allowedBuildings.map(n => data.find(b => b.name === n)).filter(Boolean);
  const firstRow = ordered.slice(0, 3);
  const secondRow = ordered.slice(3, 6);

  return (
    <div className="resources-container">
      <Menu />
      <ResourcesWidget />
      <div className={`resources-content ${selectedBuilding ? 'with-details' : ''}`}>
        <h1>Ressources</h1>

        {selectedBuilding && (
          <ResourceDetail
            building={selectedBuilding}
            onBuildingUpgraded={handleUp}
            onBuildingDowngraded={handleDown}
          />
        )}

        <div className="resources-list">
          <div className="resources-row">
            {firstRow.map(b => (
              <div key={b.id} className="building-card" onClick={() => handleClick(b)}>
                <img src={`/images/buildings/${fmt(b.name)}.png`} alt={b.name} className="building-image" />
                <h3>{b.name}</h3>
                <p>Level: {b.level}</p>
              </div>
            ))}
          </div>
          <div className="resources-row">
            {secondRow.map(b => (
              <div key={b.id} className="building-card" onClick={() => handleClick(b)}>
                <img src={`/images/buildings/${fmt(b.name)}.png`} alt={b.name} className="building-image" />
                <h3>{b.name}</h3>
                <p>Level: {b.level}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
