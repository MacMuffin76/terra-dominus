/**
 * PortalDetailModal Component
 * Detailed portal view with attack interface
 */

import React, { useState, useEffect } from 'react';
import { attackPortal, estimateBattle } from '../../api/portals';
import PortalAttackForm from './PortalAttackForm';
import PortalBattleEstimation from './PortalBattleEstimation';
import './PortalDetailModal.css';

const TIER_CONFIG = {
  grey: { name: 'Gris', rank: 'E', color: '#808080' },
  green: { name: 'Vert', rank: 'D', color: '#00FF00' },
  blue: { name: 'Bleu', rank: 'C', color: '#0099FF' },
  purple: { name: 'Violet', rank: 'B', color: '#9933FF' },
  red: { name: 'Rouge', rank: 'A', color: '#FF0000' },
  golden: { name: 'Doré', rank: 'S', color: '#FFD700' }
};

const PortalDetailModal = ({ portal, onClose, onBattleComplete }) => {
  const [units, setUnits] = useState({
    infantry: 0,
    tank: 0,
    artillery: 0,
    apc: 0,
    helicopter: 0,
    fighter: 0
  });
  const [tactic, setTactic] = useState('balanced');
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tierConfig = TIER_CONFIG[portal.tier] || TIER_CONFIG.grey;

  // Auto-estimate battle when units or tactic changes
  useEffect(() => {
    const totalUnits = Object.values(units).reduce((sum, val) => sum + val, 0);
    if (totalUnits > 0) {
      const timer = setTimeout(() => {
        handleEstimate();
      }, 500); // Debounce 500ms
      return () => clearTimeout(timer);
    } else {
      setEstimation(null);
    }
  }, [units, tactic]);

  const handleEstimate = async () => {
    try {
      const response = await estimateBattle(portal.portal_id, units);
      setEstimation(response.data);
      setError('');
    } catch (err) {
      console.error('Estimation error:', err);
      setEstimation(null);
    }
  };

  const handleAttack = async () => {
    const totalUnits = Object.values(units).reduce((sum, val) => sum + val, 0);
    if (totalUnits === 0) {
      setError('Vous devez envoyer au moins une unité');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await attackPortal(portal.portal_id, units, tactic);
      setSuccess('Bataille lancée avec succès!');
      
      setTimeout(() => {
        onBattleComplete(response.data);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'attaque du portail');
    } finally {
      setLoading(false);
    }
  };

  const formatEnemies = () => {
    if (!portal.enemy_composition) return 'Inconnu';
    try {
      const enemies = typeof portal.enemy_composition === 'string' 
        ? JSON.parse(portal.enemy_composition) 
        : portal.enemy_composition;
      
      return Object.entries(enemies)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');
    } catch (err) {
      return 'Données corrompues';
    }
  };

  const formatRewards = () => {
    if (!portal.rewards) return 'Inconnu';
    try {
      const rewards = typeof portal.rewards === 'string' 
        ? JSON.parse(portal.rewards) 
        : portal.rewards;
      
      return Object.entries(rewards)
        .map(([type, amount]) => `${amount.toLocaleString()} ${type}`)
        .join(', ');
    } catch (err) {
      return 'Données corrompues';
    }
  };

  return (
    <div className="portal-modal-overlay" onClick={onClose}>
      <div className="portal-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header" style={{ background: tierConfig.color }}>
          <h2>
            <span className="portal-rank-large">{tierConfig.rank}</span>
            Portail {tierConfig.name}
          </h2>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Portal Information */}
          <section className="modal-section">
            <h3>Informations du Portail</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Difficulté:</span>
                <span className="value">{'⭐'.repeat(Math.min(portal.difficulty, 10))} ({portal.difficulty}/10)</span>
              </div>
              <div className="info-item">
                <span className="label">Puissance Recommandée:</span>
                <span className="value power">{portal.recommended_power.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Position:</span>
                <span className="value">({portal.x_coordinate}, {portal.y_coordinate})</span>
              </div>
              <div className="info-item">
                <span className="label">Expire:</span>
                <span className="value">{new Date(portal.expiry_time).toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Enemy Composition */}
          <section className="modal-section">
            <h3>Composition Ennemie</h3>
            <p className="enemy-composition">{formatEnemies()}</p>
          </section>

          {/* Expected Rewards */}
          <section className="modal-section">
            <h3>Récompenses Attendues</h3>
            <p className="rewards">{formatRewards()}</p>
          </section>

          {/* Attack Form */}
          <section className="modal-section">
            <h3>Configuration de l'Attaque</h3>
            <PortalAttackForm
              units={units}
              tactic={tactic}
              onUnitsChange={setUnits}
              onTacticChange={setTactic}
            />
          </section>

          {/* Battle Estimation */}
          {estimation && (
            <section className="modal-section">
              <h3>Estimation du Combat</h3>
              <PortalBattleEstimation estimation={estimation} />
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAttack} 
            disabled={loading || Object.values(units).reduce((sum, val) => sum + val, 0) === 0}
            style={{ background: tierConfig.color }}
          >
            {loading ? 'Attaque en cours...' : 'Lancer l\'Attaque'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalDetailModal;
