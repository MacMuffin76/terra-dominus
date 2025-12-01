// frontend/src/components/Defense.js

import React, { useCallback, useEffect, useState } from 'react';
import Menu from './Menu';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import './Defense.css';
import DefenseDetail from './DefenseDetail';
import ResourcesWidget from './ResourcesWidget';
import { Alert, Loader, Modal } from './ui';
import DefenseCard from './defense/DefenseCard';

const Defense = () => {
  const { error, catchError, clearError } = useAsyncError('Defense');
  const [data, setData] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    clearError();
    
    try {
      const response = await axiosInstance.get('/defense/defenses');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true, 
        fallbackMessage: 'Erreur lors du chargement des défenses' 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="defense-content" id="main-content">
        <ResourcesWidget />
        <div className="defense-header">
          <h1 className="defense-title">🛡️ DÉFENSES</h1>
        </div>

        {error && (
          <Alert
            type="error"
            title="Défenses"
            message={error}
            onAction={fetchData}
          />
        )}

        <div className="defense-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <DefenseCard key={`skeleton-${idx}`} loading={true} />
            ))
          ) : (
            data.map((defense) => (
              <DefenseCard
                key={defense.id}
                defense={defense}
                isSelected={selectedDefense?.id === defense.id}
                onClick={handleDefenseClick}
              />
          ))
        )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedDefense}
        onClose={() => setSelectedDefense(null)}
        title="Détails de la défense"
      >
        {selectedDefense && (
          <DefenseDetail
            defense={selectedDefense}
            onClose={() => setSelectedDefense(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Defense;