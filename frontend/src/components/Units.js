// frontend/src/components/Units.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Units.css';
import ResourcesWidget from './ResourcesWidget';
import UnitDetail from './UnitDetail';

const Units = () => {
  const [units, setUnits] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const { data } = await axiosInstance.get('/api/units');
        setUnits(data);
      } catch (err) {
        console.error('Error fetching units:', err);
        setUnits([]);
      }
    };

    fetchUnits();
  }, []);

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  return (
    <div className="units-container">
      <Menu />
      <ResourcesWidget />

      <div className="units-content">
        <h1>Unités</h1>

        <div className="units-list">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="unit-card"
              onClick={() => setSelected(unit)}
            >
              <img
                src={`/images/training/${formatFileName(unit.name)}.png`}
                alt={unit.name}
                className="unit-image"
              />
              <h3>{unit.name}</h3>
              <p>Quantité : {unit.quantity}</p>
            </div>
          ))}
        </div>

        {selected && (
          <UnitDetail unit={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
};

export default Units;
