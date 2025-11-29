// frontend/src/components/DefenseDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './DefenseDetail.css';

const DefenseDetail = ({ defense, onDefenseUpdated }) => {
  const { error, catchError } = useAsyncError('DefenseDetail');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshDefense = async () => {
    if (!defense?.id) return;

    try {
      const { data } = await axiosInstance.get(
        `/defense/defense-buildings/${defense.id}`
      );
      setDetail(data);

      if (onDefenseUpdated) {
        onDefenseUpdated(data);
      }
    } catch (err) {
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    refreshDefense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defense?.id]);

  const handleBuildOne = catchError(
    async () => {
      if (!defense?.id) return;

      setLoading(true);
      try {
        const { data } = await axiosInstance.post(
          `/defense/defense-buildings/${defense.id}/upgrade`
        );

        setDetail(data);
        if (onDefenseUpdated) {
          onDefenseUpdated(data);
        }
      } finally {
        setLoading(false);
      }
    },
    { toast: true, logError: true }
  );

  if (!detail) {
    return <p className="defense-detail-loading">Chargement…</p>;
  }

  const bgName = (detail.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_');

  return (
    <div
      className="defense-detail"
      style={{
        backgroundImage: `url(/images/defense/${bgName}.png)`,
      }}
    >
      <div className="defense-detail-overlay">
        <h2 className="defense-title">{detail.name}</h2>

        {detail.description && (
          <p className="defense-description">{detail.description}</p>
        )}

        <div className="defense-stats">
          <div className="stat-block">
            <h4>Quantité actuelle :</h4>
            <p>{detail.quantity}</p>
          </div>

          {detail.cost != null && (
            <div className="stat-block">
              <h4>Coût par unité :</h4>
              <p>{detail.cost}</p>
            </div>
          )}
        </div>

        <div className="defense-actions">
          <button
            type="button"
            onClick={handleBuildOne}
            disabled={loading}
          >
            {loading ? 'Construction…' : 'Construire 1 unité'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefenseDetail;
