// frontend/src/components/Research.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './Research.css';
import ResearchDetail from './ResearchDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Modal } from './ui';
import ResearchCard from './research/ResearchCard';

const Research = () => {
  const { error, catchError } = useAsyncError('Research');
  const [data, setData] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/research/research-items');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="research-content" id="main-content">
        <ResourcesWidget />
        <div className="research-header">
          <h1 className="research-title">🔬 RECHERCHE</h1>
        </div>

        {error && (
          <Alert
            type="error"
            title="Recherches"
            message={error}
            onAction={fetchData}
          />
        )}

        <div className="research-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <ResearchCard key={`skeleton-${idx}`} loading={true} />
            ))
          ) : (
            data.map((research) => (
              <ResearchCard
                key={research.id}
                research={research}
                isSelected={selectedResearch?.id === research.id}
                onClick={handleResearchClick}
              />
          ))
        )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedResearch}
        onClose={() => setSelectedResearch(null)}
        title="Détails de la recherche"
      >
        {selectedResearch && (
          <ResearchDetail
            research={selectedResearch}
            onClose={() => setSelectedResearch(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Research;