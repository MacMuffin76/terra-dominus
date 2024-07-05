import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Facilities.css';
import FacilityDetail from './FacilityDetail';
import ResourcesWidget from './ResourcesWidget';

const Facilities = () => {
  const [data, setData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const allowedFacilities = ['Centre de Commandement', 'Laboratoire de Recherche', 'Terrain d\'Entraînement', 'Mur de Défense', 'Dépôt de Ressources'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/facilities/facility-buildings');
        const filteredData = response.data.filter(building => allowedFacilities.includes(building.name));
        setData(filteredData);
      } catch (error) {
        console.error('Error fetching facility buildings:', error);
        setData([]); // En cas d'erreur, on définit data comme un tableau vide pour éviter les erreurs
      }
    };
    fetchData();
  }, []);

  const handleFacilityClick = (facility) => {
    if (selectedFacility && selectedFacility.id === facility.id) {
      setSelectedFacility(null); // Désélectionne le bâtiment si déjà sélectionné
    } else {
      setSelectedFacility(facility);
    }
  };

  const formatFileName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };

  return (
    <div className="facilities-container">
      <Menu />
      <ResourcesWidget />
      <div className={`facilities-content ${selectedFacility ? 'with-details' : ''}`}>
        <h1>Installations</h1>
        {selectedFacility && (
          <FacilityDetail facility={selectedFacility} />
        )}
        <div className="facilities-list">
          {Array.isArray(data) && data.map((facility) => (
            <div key={facility.id} className="facility-card" onClick={() => handleFacilityClick(facility)}>
              <img
                src={`/images/facilities/${formatFileName(facility.name)}.png`}
                alt={facility.name}
                className="facility-image"
              />
              <h3>{facility.name}</h3>
              <p>Level: {facility.level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facilities;
