import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Resources.css';
import ResourceDetail from './ResourceDetail';
import ResourcesWidget from './ResourcesWidget';

const Resources = () => {
  const [data, setData] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const allowedBuildings = ['Ferme', 'Mine d\'or', 'Mine de métal', 'Centrale électrique', 'Carrière', 'Scierie'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/resources/resource-buildings');
        console.log('Fetched data:', response.data);
        const filteredData = response.data.filter(building => allowedBuildings.includes(building.name));
        setData(filteredData);
      } catch (error) {
        console.error('Error fetching resource buildings:', error);
        setData([]); // En cas d'erreur, on définit data comme un tableau vide pour éviter les erreurs
      }
    };
    fetchData();
  }, []);

  const handleBuildingClick = (building) => {
    if (selectedBuilding && selectedBuilding.id === building.id) {
      setSelectedBuilding(null); // Désélectionne le bâtiment si déjà sélectionné
    } else {
      setSelectedBuilding(building);
    }
  };

  const formatFileName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };

  return (
    <div className="resources-container">
      <Menu />
      <ResourcesWidget />
      <div className={`resources-content ${selectedBuilding ? 'with-details' : ''}`}>
        <h1>Ressources</h1>
        {selectedBuilding && (
          <ResourceDetail building={selectedBuilding} />
        )}
        <div className="resources-list">
          {Array.isArray(data) && data.map((building) => (
            <div key={building.id} className="building-card" onClick={() => handleBuildingClick(building)}>
              <img
                src={`/images/buildings/${formatFileName(building.name)}.png`}
                alt={building.name}
                className="building-image"
              />
              <h3>{building.name}</h3>
              <p>Level: {building.level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resources;
