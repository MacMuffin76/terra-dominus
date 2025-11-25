// frontend/src/components/Fleet.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Fleet.css';
import ResourcesWidget from './ResourcesWidget';

const Fleet = () => {
  const [units, setUnits] = useState([]);

  useEffect(() => {
    axiosInstance.get('/api/units')
      .then(({ data }) => setUnits(data))
      .catch(() => setUnits([]));
  }, []);

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
        <div className="fleet-list">
          {units.map((u) => (
            <div key={u.id} className="unit-card">
              <img
                src={`/images/training/${formatFileName(u.name)}.png`}
                alt={u.name}
                className="unit-image"
              />
              <h3>{u.name}</h3>
              <p>Quantité : {u.quantity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fleet;