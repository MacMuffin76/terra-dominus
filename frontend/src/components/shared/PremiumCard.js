import React, { useState, useCallback } from 'react';
import { Lock, TrendingUp, Clock, Zap } from 'lucide-react';
import './PremiumCard.css';

/**
 * PremiumCard - Composant de carte uniformisé avec design premium
 * @param {Object} props
 * @param {string} props.title - Titre de la carte
 * @param {string} props.image - URL de l'image
 * @param {string} props.description - Description courte
 * @param {string} props.tier - Tier (1, 2, 3, 4)
 * @param {boolean} props.isLocked - Si la carte est verrouillée
 * @param {string} props.lockReason - Raison du verrouillage
 * @param {Object} props.cost - Coûts {gold, metal, fuel, energy}
 * @param {Object} props.stats - Statistiques {attack, defense, production, etc.}
 * @param {number} props.level - Niveau actuel
 * @param {number} props.maxLevel - Niveau maximum
 * @param {number} props.buildTime - Temps de construction/recherche (en secondes)
 * @param {boolean} props.isInProgress - Si l'action est en cours
 * @param {Function} props.onClick - Callback au clic
 * @param {Function} props.onAction - Callback pour l'action principale (construire, améliorer, etc.)
 * @param {string} props.actionLabel - Label du bouton d'action
 * @param {ReactNode} props.badge - Badge personnalisé (optionnel)
 */
const PremiumCard = ({
  title,
  image,
  description,
  tier = 1,
  isLocked = false,
  lockReason = '',
  cost = {},
  stats = {},
  level = 0,
  maxLevel = null,
  buildTime = 0,
  isInProgress = false,
  onClick,
  onAction,
  actionLabel = 'Construire',
  badge = null,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const tierColors = {
    1: 'tier-1',
    2: 'tier-2',
    3: 'tier-3',
    4: 'tier-4'
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const handleImageError = useCallback((e) => {
    if (!imageError) {
      setImageError(true);
      e.target.style.opacity = '0.3';
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfjY888L3RleHQ+PC9zdmc+';
    }
  }, [imageError]);

  const handleCardClick = (e) => {
    // Ne pas déclencher onClick si on clique sur le bouton d'action
    if (e.target.closest('.premium-card-action-btn')) return;
    if (onClick) onClick();
  };

  return (
    <div 
      className={`premium-card ${tierColors[tier]} ${isLocked ? 'locked' : ''} ${isInProgress ? 'in-progress' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* Badge tier */}
      <div className="premium-card-tier">
        <span>TIER {tier}</span>
      </div>

      {/* Badge personnalisé */}
      {badge && <div className="premium-card-custom-badge">{badge}</div>}

      {/* Image avec overlay si verrouillé */}
      <div className="premium-card-image-wrapper">
        <img 
          src={image} 
          alt={title}
          className="premium-card-image"
          onError={handleImageError}
        />
        {isLocked && (
          <div className="premium-card-lock-overlay">
            <Lock size={32} />
          </div>
        )}
        {isInProgress && (
          <div className="premium-card-progress-overlay">
            <Zap size={24} className="pulse" />
            <span>En cours...</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="premium-card-content">
        {/* Header avec titre et niveau */}
        <div className="premium-card-header">
          <h3 className="premium-card-title">{title}</h3>
          {level > 0 && (
            <span className="premium-card-level">
              Niv. {level}{maxLevel && `/${maxLevel}`}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="premium-card-description">{description}</p>

        {/* Stats */}
        {Object.keys(stats).length > 0 && (
          <div className="premium-card-stats">
            {stats.attack && (
              <div className="stat-item">
                <span className="stat-icon">⚔️</span>
                <span className="stat-value">{stats.attack}</span>
              </div>
            )}
            {stats.defense && (
              <div className="stat-item">
                <span className="stat-icon">🛡️</span>
                <span className="stat-value">{stats.defense}</span>
              </div>
            )}
            {stats.production && (
              <div className="stat-item">
                <TrendingUp size={14} />
                <span className="stat-value">{Number(stats.production).toFixed(2)}/h</span>
              </div>
            )}
            {stats.capacity && (
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-value">{stats.capacity}</span>
              </div>
            )}
          </div>
        )}

        {/* Coûts */}
        {Object.keys(cost).length > 0 && !isLocked && (
          <div className="premium-card-cost">
            <span className="cost-label">Coût:</span>
            <div className="cost-values">
              {cost.gold > 0 && <span className="cost-item gold">{cost.gold.toLocaleString()}💰</span>}
              {cost.metal > 0 && <span className="cost-item metal">{cost.metal.toLocaleString()}⚙️</span>}
              {cost.fuel > 0 && <span className="cost-item fuel">{cost.fuel.toLocaleString()}⛽</span>}
              {cost.energy > 0 && <span className="cost-item energy">{cost.energy.toLocaleString()}⚡</span>}
            </div>
          </div>
        )}

        {/* Temps de construction */}
        {buildTime > 0 && !isLocked && (
          <div className="premium-card-time">
            <Clock size={14} />
            <span>{formatTime(buildTime)}</span>
          </div>
        )}

        {/* Message de verrouillage */}
        {isLocked && lockReason && (
          <div className="premium-card-lock-reason">
            <Lock size={14} />
            <span>{lockReason}</span>
          </div>
        )}

        {/* Spacer pour pousser le bouton en bas */}
        <div style={{ flex: 1 }} />

        {/* Bouton d'action */}
        {!isLocked && onAction && (
          <button 
            className="premium-card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            disabled={isInProgress}
          >
            {isInProgress ? 'En cours...' : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PremiumCard;
