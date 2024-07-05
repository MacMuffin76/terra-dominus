import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Research.css';
import ResearchDetail from './ResearchDetail';
import ResourcesWidget from './ResourcesWidget';

const Research = () => {
  const [data, setData] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);

  const allowedResearches = [
    'Extraction Avancée', 'Agriculture Intensive', 'Gestion des Ressources', 'Énergie Renouvelable',
    'Système de Défense Automatisé', 'Armement Avancé', 'Entraînement Intensif', 'Communication Rapide',
    'Technologie Médicale', 'Matériaux Renforcés', 'Camouflage Avancé', 'Transport Rapide',
    'Systèmes de Surveillance', 'Technologie Laser', 'Production Robotique', 'Boucliers Énergétiques',
    'Entraînement Commando', 'Réseaux de Tunnels', 'Gestion de Crise', 'Technologie des Nanobots'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/research/research-items');
        const filteredData = response.data.filter(research => allowedResearches.includes(research.name));
        setData(filteredData);
      } catch (error) {
        console.error('Error fetching research items:', error);
        setData([]); // Set data to an empty array on error
      }
    };
    fetchData();
  }, []);

  const handleResearchClick = (research) => {
    if (selectedResearch && selectedResearch.id === research.id) {
      setSelectedResearch(null); // Deselect if already selected
    } else {
      setSelectedResearch(research);
    }
  };

  const formatFileName = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remplace les espaces par des underscores et enlève les accents
  };

  return (
    <div className="research-container">
      <Menu />
      <ResourcesWidget />
      <div className={`research-content ${selectedResearch ? 'with-details' : ''}`}>
        <h1>Recherche</h1>
        {selectedResearch && (
          <ResearchDetail research={selectedResearch} />
        )}
        <div className="research-list">
          {Array.isArray(data) && data.map((research) => (
            <div key={research.id} className="research-card" onClick={() => handleResearchClick(research)}>
              <img
                src={`/images/research/${formatFileName(research.name)}.png`}
                alt={research.name}
                className="research-image"
              />
              <h3>{research.name}</h3>
              <p>Niveau: {research.level}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Research;
