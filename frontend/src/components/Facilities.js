import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './Facilities.css';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader } from './ui';
import FacilityCard from './facilities/FacilityCard';
import FacilityDetailModal from './facilities/FacilityDetailModal';

const Facilities = () => {
  const { error, catchError } = useAsyncError('Facilities');
  const [data, setData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1) Ordre fixe souhaité
  const allowedFacilities = [
    'Centre de Commandement',
    'Laboratoire de Recherche',
    'Terrain d\'Entraînement'
  ];

  const fetchData = async (signal) => {
    setLoading(true);
    
    try {
      const { data: facilities } = await axiosInstance.get(
        '/facilities/facility-buildings',
        { signal }
      );
      
      // Vérifier si le composant est toujours monté
      if (!signal?.aborted) {
        // 2) Filtrer les facilities autorisées
        const filtered = facilities.filter(f =>
          allowedFacilities.includes(f.name)
        );
        setData(filtered);
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        if (!signal?.aborted) {
          setLoading(false);
        }
        await catchError(async () => { throw err; }, { 
          toast: true, 
          logError: true 
        }).catch(() => {}); // Ignorer le re-throw
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    
    return () => {
      controller.abort(); // Annuler la requête au démontage
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Helpers pour gestion du click et callbacks
  const handleFacilityClick = facility =>
    setSelectedFacility(prev =>
      prev && prev.id === facility.id ? null : facility
    );

  const handleFacilityUpgraded = upgraded => {
    const updated = data.map(f =>
      f.id === upgraded.id ? upgraded : f
    );
    setData(updated);
    setSelectedFacility(upgraded);
  };

  const handleFacilityDowngraded = downgraded => {
    const updated = data.map(f =>
      f.id === downgraded.id ? downgraded : f
    );
    setData(updated);
    setSelectedFacility(downgraded);
  };

  // 4) formatage du nom pour l'image
  const formatFileName = name =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '_');

  // 5) On ordonne explicitement selon allowedFacilities
  const ordered = allowedFacilities
    .map(name => data.find(f => f.name === name))
    .filter(Boolean);

  return (
    <div className="facilities-container">
      <Menu />

      <div className="facilities-content" id="main-content">
        <ResourcesWidget />
        <div className="facilities-header">
          <h1 className="facilities-title">🏛️ INSTALLATIONS</h1>
        </div>

        {loading && <Loader label="Chargement des installations..." />}
        
        {error && (
          <Alert
            type="error"
            title="Installations"
            message={error}
            onAction={() => fetchData().catch(() => {})}
          />
        )}

        <div className="facilities-grid">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <FacilityCard key={`skeleton-${idx}`} loading={true} />
            ))
          ) : ordered.length > 0 ? (
            ordered.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                isSelected={selectedFacility?.id === facility.id}
                onClick={handleFacilityClick}
              />
            ))
          ) : (
            !error && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>Aucune installation disponible</p>
              </div>
            )
          )}
        </div>

        {selectedFacility && (
          <FacilityDetailModal
            facility={selectedFacility}
            onClose={() => setSelectedFacility(null)}
            onFacilityUpgraded={handleFacilityUpgraded}
            onFacilityDowngraded={handleFacilityDowngraded}
          />
        )}
      </div>
    </div>
  );
};

export default Facilities;