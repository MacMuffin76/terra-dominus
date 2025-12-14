// src/components/facilities/FacilityDetailModal.js

import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useResources } from '../../context/ResourcesContext';
import socket from '../../utils/socket';
import './FacilityDetailModal.css';

const FacilityDetailModal = ({ facility, onClose, onFacilityUpgraded, onFacilityDowngraded }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resources, setResources } = useResources();

  const formatAmount = (value) => {
    const n = Math.floor(Number(value) || 0);
    return n.toLocaleString('fr-FR');
  };

  const formatFileName = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, '')
      .replace(/\s+/g, '_');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // Utiliser l'ID si disponible, sinon utiliser le key pour retrouver la facility
        let endpoint = facility.id 
          ? `/facilities/facility-buildings/${facility.id}`
          : `/facilities/unlock/details/${facility.key}`;
        
        const { data } = await axiosInstance.get(endpoint);
        setDetail(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();

    // Écouter les événements socket pour rafraîchir quand la construction est terminée
    const handleConstructionUpdate = () => {
      console.log('🏗️ Construction queue updated, refreshing facility details...');
      fetchDetail();
    };

    socket.on('construction_queue:update', handleConstructionUpdate);

    return () => {
      socket.off('construction_queue:update', handleConstructionUpdate);
    };
  }, [facility.id, facility.key]);

  const handleUpgrade = async () => {
    if (!detail) return;
    if (!facility.key) {
      alert('Erreur: facilityKey manquante');
      return;
    }

    try {
      const { data } = await axiosInstance.post(
        `/facilities/unlock/upgrade/${facility.key}`
      );

      if (data.message) {
        alert(data.message);
        // Rafraîchir les données de la facility pour voir la construction en cours
        setTimeout(() => {
          onClose(); // Fermer la modale pour montrer la construction en cours
        }, 1000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'amélioration');
    }
  };

  const handleDowngrade = async () => {
    if (!detail || detail.level <= 0) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir détruire ${facility.name} (niveau ${facility.level}) ?`
    );
    if (!confirmed) return;

    try {
      const { data } = await axiosInstance.post(
        `/facilities/facility-buildings/${facility.id}/downgrade`
      );

      if (data.message) {
        alert(data.message);
      } else {
        const downgraded = { ...facility, level: Math.max(0, facility.level - 1) };
        onFacilityDowngraded(downgraded);

        const { data: refreshed } = await axiosInstance.get(
          `/facilities/facility-buildings/${facility.id}`
        );
        setDetail(refreshed);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la destruction');
    }
  };

  const canAffordUpgrade = () => {
    if (!detail?.nextLevelCost) return false;
    
    // Vérifier les prérequis
    if (detail.prerequisites && !detail.prerequisites.meetsRequirements) {
      return false;
    }
    
    // Vérifier les ressources
    return detail.nextLevelCost.every((cost) => {
      const userResource = resources.find((r) => r.type === cost.resource_type);
      return userResource && Number(userResource.amount) >= Number(cost.amount);
    });
  };

  if (!facility) return null;

  return (
    <div className="terra-modal-overlay" onClick={onClose}>
      <div className="terra-modal terra-facility-modal" onClick={(e) => e.stopPropagation()}>
        <button className="terra-modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className="terra-facility-modal-header">
          <div className="terra-facility-modal-icon">
            <img
              src={`/images/facilities/${formatFileName(facility.name)}.png`}
              alt={facility.name}
            />
          </div>
          <div className="terra-facility-modal-title">
            <h2>{facility.name}</h2>
            <span className="terra-badge terra-badge-primary">Niveau {facility.level}</span>
          </div>
        </div>

        {loading ? (
          <div className="terra-facility-modal-loading">
            <div className="terra-loader"></div>
            <p>Chargement des détails...</p>
          </div>
        ) : error ? (
          <div className="terra-facility-modal-error">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <>
            <div className="terra-facility-modal-body">
              <div className="terra-facility-modal-section">
                <h3>📊 Informations</h3>
                <div className="terra-facility-info-grid">
                  <div className="terra-facility-info-item">
                    <span className="label">Niveau actuel</span>
                    <span className="value">{detail.level}</span>
                  </div>
                  <div className="terra-facility-info-item">
                    <span className="label">Niveau maximum</span>
                    <span className="value">{detail.maxLevel}</span>
                  </div>
                  {detail.description && (
                    <div className="terra-facility-info-item full-width">
                      <span className="label">Description</span>
                      <span className="value">{detail.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {detail.prerequisites && (
                <div className="terra-facility-modal-section">
                  <h3>🔓 Prérequis</h3>
                  <div className="terra-facility-prerequisites">
                    <div className={`terra-facility-prerequisite-item ${detail.prerequisites.meetsRequirements ? 'met' : 'not-met'}`}>
                      <span className="prerequisite-icon">
                        {detail.prerequisites.meetsRequirements ? '✅' : '🔒'}
                      </span>
                      <div className="prerequisite-details">
                        <span className="prerequisite-name">Centre de Commandement</span>
                        <span className="prerequisite-requirement">
                          Niveau requis: {detail.prerequisites.requiredCommandCenter} 
                          {' '}(Actuel: {detail.prerequisites.currentCommandCenter})
                        </span>
                      </div>
                    </div>
                    {!detail.prerequisites.meetsRequirements && (
                      <div className="terra-alert terra-alert-warning" style={{ marginTop: '0.5rem' }}>
                        <span className="alert-icon">⚠️</span>
                        <span className="alert-text">
                          Vous devez améliorer votre Centre de Commandement au niveau {detail.prerequisites.requiredCommandCenter} 
                          {detail.level === 0 ? ' pour débloquer' : ' pour continuer à améliorer'} cette installation.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detail.nextLevelCost && detail.nextLevelCost.length > 0 && (
                <div className="terra-facility-modal-section">
                  <h3>💰 Coût d'amélioration (Niveau {detail.level + 1})</h3>
                  <div className="terra-facility-costs">
                    {detail.nextLevelCost.map((cost) => {
                      const userResource = resources.find((r) => r.type === cost.resource_type);
                      const userAmount = Number(userResource?.amount) || 0;
                      const costAmount = Number(cost.amount) || 0;
                      const canAfford = userAmount >= costAmount;

                      return (
                        <div
                          key={cost.resource_type}
                          className={`terra-facility-cost-item ${canAfford ? 'affordable' : 'not-affordable'}`}
                        >
                          <img
                            src={`/images/resources/${formatFileName(cost.resource_type)}.png`}
                            alt={cost.resource_type}
                            className="terra-facility-cost-icon"
                          />
                          <div className="terra-facility-cost-details">
                            <span className="resource-name">
                              {cost.resource_type.charAt(0).toUpperCase() + cost.resource_type.slice(1)}
                            </span>
                            <span className="resource-amount">
                              {formatAmount(userAmount)} / {formatAmount(costAmount)}
                            </span>
                          </div>
                          {canAfford ? (
                            <span className="status-icon">✓</span>
                          ) : (
                            <span className="status-icon">✗</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="terra-facility-modal-actions">
              {detail.nextLevelCost && detail.nextLevelCost.length > 0 && (
                <button
                  className="terra-btn terra-btn-primary"
                  onClick={handleUpgrade}
                  disabled={!canAffordUpgrade()}
                >
                  ⬆️ Améliorer
                </button>
              )}
              {detail.level > 0 && (
                <button
                  className="terra-btn terra-btn-danger"
                  onClick={handleDowngrade}
                >
                  ⬇️ Détruire
                </button>
              )}
              <button className="terra-btn terra-btn-ghost" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacilityDetailModal;
