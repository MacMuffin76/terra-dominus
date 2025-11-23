// frontend/src/components/Research.js

import React, { useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Research.css';
import ResearchDetail from './ResearchDetail';
import ResourcesWidget from './ResourcesWidget';

const Research = () => {
  const [data, setData] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/research/research-items');
        // On prend toutes les recherches renvoyées par l'API, sans filtre
        setData(response.data);
      } catch (error) {
        console.error('Error fetching research items:', error);
        setData([]); // En cas d'erreur, on définit data comme un tableau vide
      }
    };
    fetchData();
  }, []);

  const handleResearchClick = (research) => {
    if (selectedResearch && selectedResearch.id === research.id) {
      setSelectedResearch(null);
    } else {
      setSelectedResearch(research);
    }
  };

  const formatFileName = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')                    // décompose accents
      .replace(/[\u0300-\u036f]/g, '')     // retire les accents
      .replace(/['’]/g, '')                // retire apostrophes (simple & typographique)
      .replace(/\s+/g, '_');               // espaces → underscore
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
          {data.map((research) => (
            <div
              key={research.id}
              className="research-card"
              onClick={() => handleResearchClick(research)}
            >
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
