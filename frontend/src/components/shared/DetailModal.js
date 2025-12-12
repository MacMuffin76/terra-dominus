import React, { useState, useCallback } from 'react';
import { X, TrendingUp, Clock, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import './DetailModal.css';

/**
 * DetailModal - Modal premium pour afficher les détails d'une carte
 * @param {Object} props
 * @param {boolean} props.isOpen - Si le modal est ouvert
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.title - Titre
 * @param {string} props.image - URL de l'image
 * @param {string} props.description - Description détaillée
 * @param {Object} props.stats - Statistiques détaillées
 * @param {Object} props.cost - Coûts
 * @param {Object} props.requirements - Prérequis
 * @param {Array} props.benefits - Liste des bénéfices
 * @param {number} props.level - Niveau actuel
 * @param {number} props.nextLevel - Prochain niveau
 * @param {Object} props.nextLevelStats - Stats du prochain niveau
 * @param {Function} props.onAction - Callback action principale
 * @param {string} props.actionLabel - Label du bouton d'action
 * @param {boolean} props.actionDisabled - Si l'action est désactivée
 * @param {string} props.tier - Tier
 */
const DetailModal = ({
  isOpen,
  onClose,
  title,
  image,
  description,
  stats = {},
  cost = {},
  requirements = {},
  benefits = [],
  level = 0,
  nextLevel = null,
  nextLevelStats = {},
  onAction,
  actionLabel = 'Construire',
  actionDisabled = false,
  tier = 1
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback((e) => {
    if (!imageError) {
      setImageError(true);
      e.target.style.opacity = '0.3';
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfjY888L3RleHQ+PC9zdmc+';
    }
  }, [imageError]);

  if (!isOpen) return null;

  const tierColors = {
    1: '#00ff88',
    2: '#00d4ff',
    3: '#ff00ff',
    4: '#ffd700'
  };

  const formatStat = (key, value) => {
    const icons = {
      attack: '⚔️',
      defense: '🛡️',
      health: '❤️',
      production: '📈',
      capacity: '📦',
      speed: '⚡',
      range: '🎯'
    };
    return { icon: icons[key] || '📊', value };
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-modal-header" style={{ borderTopColor: tierColors[tier] }}>
          <div className="detail-modal-header-content">
            <div className="detail-modal-tier-badge" style={{ color: tierColors[tier], borderColor: tierColors[tier] }}>
              TIER {tier}
            </div>
            <h2 className="detail-modal-title">{title}</h2>
            {level > 0 && (
              <span className="detail-modal-level">Niveau {level}</span>
            )}
          </div>
          <button className="detail-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="detail-modal-body">
          {/* Image */}
          {image && (
            <div className="detail-modal-image-wrapper">
              <img 
                src={image} 
                alt={title}
                className="detail-modal-image"
                onError={handleImageError}
              />
            </div>
          )}

          {/* Description */}
          <div className="detail-modal-section">
            <h3>Description</h3>
            <p className="detail-modal-description">{description}</p>
          </div>

          {/* Stats actuelles */}
          {Object.keys(stats).length > 0 && (
            <div className="detail-modal-section">
              <h3>Statistiques</h3>
              <div className="detail-modal-stats-grid">
                {Object.entries(stats).map(([key, value]) => {
                  const { icon, value: formattedValue } = formatStat(key, value);
                  return (
                    <div key={key} className="detail-modal-stat-item">
                      <span className="stat-icon">{icon}</span>
                      <div className="stat-content">
                        <span className="stat-label">{key}</span>
                        <span className="stat-value">{formattedValue}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next level preview */}
          {nextLevel && Object.keys(nextLevelStats).length > 0 && (
            <div className="detail-modal-section next-level-section">
              <h3>
                <TrendingUp size={18} />
                Niveau {nextLevel}
              </h3>
              <div className="detail-modal-stats-grid">
                {Object.entries(nextLevelStats).map(([key, value]) => {
                  const { icon, value: formattedValue } = formatStat(key, value);
                  const currentValue = stats[key] || 0;
                  const diff = value - currentValue;
                  return (
                    <div key={key} className="detail-modal-stat-item upgrade">
                      <span className="stat-icon">{icon}</span>
                      <div className="stat-content">
                        <span className="stat-label">{key}</span>
                        <span className="stat-value">
                          {formattedValue}
                          {diff > 0 && <span className="stat-diff">+{diff}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="detail-modal-section">
              <h3>Bénéfices</h3>
              <ul className="detail-modal-benefits">
                {benefits.map((benefit, index) => (
                  <li key={index}>
                    <CheckCircle size={16} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {Object.keys(requirements).length > 0 && (
            <div className="detail-modal-section">
              <h3>Prérequis</h3>
              <div className="detail-modal-requirements">
                {Object.entries(requirements).map(([key, req]) => (
                  <div key={key} className={`requirement-item ${req.met ? 'met' : 'unmet'}`}>
                    {req.met ? <CheckCircle size={16} /> : <Lock size={16} />}
                    <span>{req.label || key}: {req.current}/{req.required}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost */}
          {Object.keys(cost).length > 0 && (
            <div className="detail-modal-section">
              <h3>Coût</h3>
              <div className="detail-modal-cost-grid">
                {cost.gold > 0 && (
                  <div className="cost-item gold">
                    <span className="cost-icon">💰</span>
                    <span className="cost-value">{cost.gold.toLocaleString()}</span>
                  </div>
                )}
                {cost.metal > 0 && (
                  <div className="cost-item metal">
                    <span className="cost-icon">⚙️</span>
                    <span className="cost-value">{cost.metal.toLocaleString()}</span>
                  </div>
                )}
                {cost.fuel > 0 && (
                  <div className="cost-item fuel">
                    <span className="cost-icon">⛽</span>
                    <span className="cost-value">{cost.fuel.toLocaleString()}</span>
                  </div>
                )}
                {cost.energy > 0 && (
                  <div className="cost-item energy">
                    <span className="cost-icon">⚡</span>
                    <span className="cost-value">{cost.energy.toLocaleString()}</span>
                  </div>
                )}
                {cost.time > 0 && (
                  <div className="cost-item time">
                    <Clock size={16} />
                    <span className="cost-value">
                      {cost.time < 60 ? `${cost.time}s` :
                       cost.time < 3600 ? `${Math.floor(cost.time / 60)}min` :
                       `${Math.floor(cost.time / 3600)}h`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer avec action */}
        {onAction && (
          <div className="detail-modal-footer">
            <button 
              className="detail-modal-action-btn"
              onClick={onAction}
              disabled={actionDisabled}
              style={{
                borderColor: tierColors[tier],
                boxShadow: !actionDisabled ? `0 4px 20px ${tierColors[tier]}40` : 'none'
              }}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;
