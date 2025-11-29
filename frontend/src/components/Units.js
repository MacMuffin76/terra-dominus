// frontend/src/components/Units.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import './Units.css';
import ResourcesWidget from './ResourcesWidget';
import UnitDetail from './UnitDetail';

const Units = () => {
  const { catchError } = useAsyncError('Units');
  const [units, setUnits] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      const data = await catchError(
        async () => {
          const response = await axiosInstance.get('/api/units');
          return response.data;
        },
        { toast: true, logError: true, fallbackMessage: 'Erreur lors du chargement des unités' }
      );

      setUnits(data || []);
    };

    fetchUnits();
  }, [catchError]);

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

      <div className="units-content" id="main-content">
        <ResourcesWidget />
        <h1>Unités</h1>

        <div className="units-list">
          {units.map((unit) => (
            <button
              type="button"
              key={unit.id}
              className={`unit-card ${selected?.id === unit.id ? 'selected' : ''}`}
              onClick={() => setSelected(unit)}
              aria-pressed={selected?.id === unit.id}
              aria-label={`${unit.name}, quantité ${unit.quantity}`}
            >
              <img
                src={`/images/training/${formatFileName(unit.name)}.png`}
                alt={unit.name}
                className="unit-image"
              />
              <h3>{unit.name}</h3>
              <p>Quantité : {unit.quantity}</p>
            </button>
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
