// frontend/src/components/Training.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';   // ← ../utils et non ./utils
import './Training.css';
import ResourcesWidget from './ResourcesWidget';

const Training = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        // On appelle '/units' (baseURL = '/api'), pas '/api/units'
        const response = await axiosInstance.get('/units');
        setUnits(response.data);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Erreur lors du chargement des unités');
        setUnits([]);
      }
    };
    fetchUnits();
  }, []);

  const handleUnitClick = (unit) => {
    if (selectedUnit && selectedUnit.id === unit.id) {
      setSelectedUnit(null);
    } else {
      setSelectedUnit(unit);
    }
  };

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // supprime les accents
      .replace(/['’]/g, '')              // supprime les apostrophes
      .replace(/\s+/g, '_');             // espaces → underscore

  return (
    <div className="training-container">
      <Menu />
      <ResourcesWidget />
      <div className={`training-content ${selectedUnit ? 'with-details' : ''}`}>
        <h1>Entraînement de Troupes</h1>
        {error && <p className="error-message">{error}</p>}

        <div className="training-list">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="training-card"
              onClick={() => handleUnitClick(unit)}
            >
              <img
                src={`/images/training/${formatFileName(unit.name)}.png`}
                alt={unit.name}
                className="training-image"
              />
              <h3>{unit.name}</h3>
              <p>Quantité : {unit.quantity}</p>
            </div>
          ))}
        </div>

        {selectedUnit && (
          <div className="training-detail">
            <h2>{selectedUnit.name}</h2>
            <p>Quantité actuelle : {selectedUnit.quantity}</p>
            <button onClick={() => setSelectedUnit(null)}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;
