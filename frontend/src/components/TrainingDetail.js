// frontend/src/components/TrainingDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAsyncError } from '../hooks/useAsyncError';
import { logger } from '../utils/logger';
import './TrainingDetail.css';

const formatNumber = (value) =>
  new Intl.NumberFormat('fr-FR').format(Number(value || 0));

const TrainingDetail = ({ training, onTrainingUpdated }) => {
  const { error, catchError } = useAsyncError('TrainingDetail');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshTraining = async () => {
    if (!training?.id) return;

    try {
      const { data } = await axiosInstance.get(
        `/training/training-centers/${training.id}`
      );
      setDetail(data);
      if (onTrainingUpdated) {
        onTrainingUpdated(data);
      }
    } catch (err) {
      await catchError(async () => { throw err; }, { 
        toast: true, 
        logError: true 
      }).catch(() => {});
    }
  };

  useEffect(() => {
    refreshTraining();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training?.id]);

  const handleUpgrade = catchError(
    async () => {
      if (!detail) return;
      setLoading(true);
      try {
        const { data } = await axiosInstance.post(
          `/training/training-centers/${training.id}/upgrade`
        );
        setDetail(data);
        if (onTrainingUpdated) {
          onTrainingUpdated(data);
        }
      } finally {
        setLoading(false);
      }
    },
    { toast: true, logError: true }
  );

  const handleDestroy = catchError(
    async () => {
      if (!window.confirm('Supprimer ce centre d\'entraînement ?')) return;

      setLoading(true);
      try {
        await axiosInstance.post(
          `/training/training-centers/${training.id}/destroy`
        );
        if (onTrainingUpdated) {
          onTrainingUpdated(null); // le parent saura retirer la carte
        }
        setDetail(null);
      } finally {
        setLoading(false);
      }
    },
    { toast: true, logError: true }
  );

  if (!detail) {
    return (
      <div className="training-detail-loading">
        Chargement des détails…
      </div>
    );
  }

  // Pour un éventuel fond illustré basé sur le nom
  const bgName = detail.name
    ? detail.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’]/g, '')
        .replace(/\s+/g, '_')
    : 'training';

  return (
    <div
      className="training-detail"
      style={{
        backgroundImage: `url(/images/training/${bgName}.png)`,
      }}
    >
      <div className="training-detail-overlay" />

      <div className="training-detail-content">
        <div className="training-detail-header">
          <div>
            <h2 className="training-detail-title">{detail.name}</h2>
            <div className="training-detail-subtitle">
              NIVEAU {detail.level ?? 0}
            </div>
          </div>
        </div>

        {detail.description && (
          <p className="training-detail-description">
            {detail.description}
          </p>
        )}

        <div className="training-stats">
          <div className="training-stat-block">
            <h4>Niveau actuel</h4>
            <p className="training-stat-value">
              {detail.level ?? 0}
            </p>
          </div>

          <div className="training-stat-block">
            <h4>Niveau suivant</h4>
            <p className="training-stat-value">
              {detail.level != null ? detail.level + 1 : 1}
            </p>
          </div>

          <div className="training-stat-block">
            <h4>Coût niveau suivant</h4>
            <p className="training-stat-value">
              {detail.nextLevelCost != null
                ? `${formatNumber(detail.nextLevelCost)}`
                : '—'}
            </p>
          </div>
        </div>

        <div className="training-actions">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Amélioration…' : 'Améliorer'}
          </button>

          <button
            type="button"
            onClick={handleDestroy}
            disabled={loading}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;
