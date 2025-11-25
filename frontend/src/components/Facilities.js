import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import './Facilities.css';
import FacilityDetail from './FacilityDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Skeleton } from './ui';

const Facilities = () => {
  const [data, setData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1) Ordre fixe souhaité
  const allowedFacilities = [
    'Centre de Commandement',
    'Laboratoire de Recherche',
    'Terrain d\'Entraînement'
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: facilities } = await axiosInstance.get(
        '/facilities/facility-buildings'
      );
      // 2) Filtrer les facilities autorisées
      const filtered = facilities.filter(f =>
        allowedFacilities.includes(f.name)
      );
      setData(filtered);
    } catch (err) {
      console.error('Error fetching facility buildings:', err);
      setError("Impossible de charger les installations.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <ResourcesWidget />

      <div
        className={`facilities-content ${selectedFacility ? 'with-details' : ''}`}
        id="main-content"
      >
        <h1>Installations</h1>

        {loading && <Loader label="Chargement des installations" />}
        {error && (
          <Alert
            type="error"
            title="Installations"
            message={error}
            onAction={fetchData}
          />
        )}

        {selectedFacility && (
          <FacilityDetail
            facility={selectedFacility}
            onFacilityUpgraded={handleFacilityUpgraded}
            onFacilityDowngraded={handleFacilityDowngraded}
          />
        )}

        <div className="facilities-list">
          {(loading ? Array.from({ length: 3 }) : ordered).map((facility, idx) => (
            <div
              key={facility?.id || `facility-skeleton-${idx}`}
              className="facility-card"
              onClick={() => facility && handleFacilityClick(facility)}
            >
              {loading ? (
                <Skeleton width="100%" height="200px" />
              ) : (
                <img
                  src={`/images/facilities/${formatFileName(facility.name)}.png`}
                  alt={facility.name}
                  className="facility-image"
                />
              )}
              <h3>{loading ? <Skeleton width="60%" /> : facility.name}</h3>
              <p>
                {loading ? <Skeleton width="40%" /> : `Level: ${facility.level}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facilities;