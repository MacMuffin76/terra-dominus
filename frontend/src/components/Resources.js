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
  const [allowedBuildings, setAllowedBuildings] = useState([]);
  const { resources } = useResources();

  const orderBuildings = (list, allowed) =>
    allowed.map(n => list.find(b => b.name === n)).filter(Boolean);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: allowed }, { data: buildings }] = await Promise.all([
          axiosInstance.get('/resources/resource-buildings/allowed'),
          axiosInstance.get('/resources/resource-buildings'),
        ]);

        setAllowedBuildings(allowed);
        const filtered = buildings.filter(b => allowed.includes(b.name));
        setData(orderBuildings(filtered, allowed));
      } catch (err) {
        console.error('Error fetching resource buildings:', err);
        setAllowedBuildings([]);
        setData([]);
      }
    };
    fetchData();
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

  const firstRow = data.slice(0, 3);
  const secondRow = data.slice(3, 6);
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
