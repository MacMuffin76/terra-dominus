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

  const allowedDefenses = ['Artillerie', 'Canon', 'Lance-missiles', 'Tourelle', 'Tour Laser', 'Canon à Plasma', 'Tour de Garde', 'Pièges à Pointes'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/defense/defenses');
        const filteredData = response.data.filter(defense => allowedDefenses.includes(defense.name));
        setData(filteredData);
      } catch (error) {
        console.error('Error fetching defense buildings:', error);
        setError('Error fetching defense buildings');
      }
    };
    fetchData();
  }, []);

  const handleDefenseClick = (defense) => {
    if (selectedDefense && selectedDefense.id === defense.id) {
      setSelectedDefense(null); // Deselect if already selected
    } else {
      setSelectedDefense(defense);
    }
  };

  const formatFileName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };

  return (
    <div className="defense-container">
      <Menu />
      <ResourcesWidget />
      <div className={`defense-content ${selectedDefense ? 'with-details' : ''}`}>
        <h1>Défenses</h1>
        {error && <p className="error-message">{error}</p>}
        {selectedDefense && (
          <DefenseDetail defense={selectedDefense} />
        )}
        <div className="defense-list">
          {Array.isArray(data) && data.map((defense) => (
            <div key={defense.id} className="defense-card" onClick={() => handleDefenseClick(defense)}>
              <img
                src={`/images/defense/${formatFileName(defense.name)}.png`}
                alt={defense.name}
                className="defense-image"
              />
              <h3>{defense.name}</h3>
              <p>Quantité: {defense.quantity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Defense;
