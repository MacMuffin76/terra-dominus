// frontend/src/components/Defense.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Defense.css';
import DefenseDetail from './DefenseDetail';
import ResourcesWidget from './ResourcesWidget';

const Defense = () => {
  const [data, setData] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/defense/defenses');
        // On prend toutes les défenses renvoyées par l'API, sans filtre
        setData(response.data);
      } catch (err) {
        console.error('Error fetching defense buildings:', err);
        setError('Error fetching defense buildings');
      }
    };
    fetchData();
  }, []);

  const handleDefenseClick = (def) => {
    if (selectedDefense && selectedDefense.id === def.id) {
      setSelectedDefense(null);
    } else {
      setSelectedDefense(def);
    }
  };

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  return (
    <div className="defense-container">
      <Menu />
      <ResourcesWidget />
      <div
        className={`defense-content ${selectedDefense ? 'with-details' : ''}`}
        id="main-content"
      >
        <h1>Défenses</h1>
        {error && <p className="error-message">{error}</p>}

        {selectedDefense && <DefenseDetail defense={selectedDefense} />}

        <div className="defense-list">
          {data.map((def) => (
            <div
              key={def.id}
              className="defense-card"
              onClick={() => handleDefenseClick(def)}
            >
              <img
                src={`/images/defense/${formatFileName(def.name)}.png`}
                alt={def.name}
                className="defense-image"
              />
              <h3>{def.name}</h3>
              <p>Quantité: {def.quantity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Defense;
