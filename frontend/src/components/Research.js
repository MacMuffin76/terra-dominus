// frontend/src/components/Research.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Research.css';
import ResearchDetail from './ResearchDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Skeleton } from './ui';

const Research = () => {
  const [data, setData] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/research/research-items');
      // On prend toutes les recherches renvoyées par l'API, sans filtre
      setData(response.data);
    } catch (err) {
      console.error('Error fetching research items:', err);
      setError('Impossible de charger les recherches.');
      setData([]); // En cas d'erreur, on définit data comme un tableau vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div
        className={`research-content ${selectedResearch ? 'with-details' : ''}`}
        id="main-content"
      >
        <h1>Recherche</h1>

        {loading && <Loader label="Chargement des recherches" />}
        {error && (
          <Alert
            type="error"
            title="Recherches"
            message={error}
            onAction={fetchData}
          />
        )}

        {selectedResearch && (
          <ResearchDetail research={selectedResearch} />
        )}

        <div className="research-list">
          {(loading ? Array.from({ length: 6 }) : data).map((research, idx) => (
            <div
              key={research?.id || `research-skeleton-${idx}`}
              className="research-card"
              onClick={() => research && handleResearchClick(research)}
            >
              {loading ? (
                <Skeleton width="100%" height="180px" />
              ) : (
                <img
                  src={`/images/research/${formatFileName(research.name)}.png`}
                  alt={research.name}
                  className="research-image"
                />
              )}
              <h3>{loading ? <Skeleton width="70%" /> : research.name}</h3>
              <p>{loading ? <Skeleton width="40%" /> : `Niveau: ${research.level}`}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Research;