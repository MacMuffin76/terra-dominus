// frontend/src/components/DefenseDetail.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import './DefenseDetail.css';

const DefenseDetail = ({ defense, onDefenseUpdated }) => {
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
      console.error('Erreur lors du chargement de la défense :', err);
      alert(
        err.response?.data?.message ||
          "Erreur lors du chargement des détails de la défense"
      );
    }
  };

  useEffect(() => {
    refreshDefense();
    // pas de commentaire eslint ici pour éviter l’erreur sur react-hooks/exhaustive-deps
    // on veut juste recharger quand l’ID change
  }, [defense?.id]); // OK même si defense est undefined au début

  const handleBuildOne = async () => {
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
    } catch (err) {
      console.error('Erreur lors de la construction de défense :', err);
      alert(
        err.response?.data?.message ||
          'Erreur lors de la construction de la défense'
      );
    } finally {
      setLoading(false);
    }
  };

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
