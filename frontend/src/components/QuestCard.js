// QuestCard.js - Individual quest card component
import React from 'react';
import './QuestCard.css';

const QuestCard = ({ quest, onClaim, onStart }) => {
  const {
    quest: questData,
    status,
    progress,
    progressPercentage,
    isCompleted,
    isExpired,
    expires_at
  } = quest;

  // Quest difficulty colors
  const difficultyColors = {
    easy: '#4caf50',
    medium: '#2196f3',
    hard: '#ff9800',
    epic: '#9c27b0'
  };

  // Quest category icons (using emojis for simplicity)
  const categoryIcons = {
    combat: '⚔️',
    economy: '💰',
    buildings: '🏗️',
    research: '🔬',
    social: '🤝'
  };

  // Quest type badges
  const typeBadges = {
    daily: { label: 'Quotidienne', color: '#2196f3' },
    weekly: { label: 'Hebdomadaire', color: '#9c27b0' },
    achievement: { label: 'Succès', color: '#ff9800' }
  };

  const getTimeRemaining = () => {
    if (!expires_at) return null;
    
    const now = new Date();
    const expiry = new Date(expires_at);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expirée';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const handleClaimClick = () => {
    if (onClaim && status === 'completed') {
      onClaim(questData.id);
    }
  };

  const handleStartClick = () => {
    if (onStart && status === 'available') {
      onStart(questData.id);
    }
  };

  const renderRewards = () => {
    const rewards = [];
    
    if (questData.reward_or > 0) {
      rewards.push(
        <div key="or" className="quest-reward">
          <span className="reward-icon">💰</span>
          <span className="reward-amount">{questData.reward_or.toLocaleString()}</span>
        </div>
      );
    }
    
    if (questData.reward_metal > 0) {
      rewards.push(
        <div key="metal" className="quest-reward">
          <span className="reward-icon">⚙️</span>
          <span className="reward-amount">{questData.reward_metal.toLocaleString()}</span>
        </div>
      );
    }
    
    if (questData.reward_carburant > 0) {
      rewards.push(
        <div key="carburant" className="quest-reward">
          <span className="reward-icon">⛽</span>
          <span className="reward-amount">{questData.reward_carburant.toLocaleString()}</span>
        </div>
      );
    }
    
    if (questData.reward_xp > 0) {
      rewards.push(
        <div key="xp" className="quest-reward">
          <span className="reward-icon">⭐</span>
          <span className="reward-amount">{questData.reward_xp.toLocaleString()} XP</span>
        </div>
      );
    }
    
    return rewards;
  };

  const typeBadge = typeBadges[questData.type] || typeBadges.daily;
  const timeRemaining = getTimeRemaining();
  const isClaimable = status === 'completed' && !isExpired;
  const canStart = status === 'available' && !isExpired;

  return (
    <div className={`quest-card quest-${questData.difficulty} quest-status-${status} ${isExpired ? 'expired' : ''}`}>
      <div className="quest-header">
        <div className="quest-category-icon">
          {categoryIcons[questData.category] || '📋'}
        </div>
        <div className="quest-title-section">
          <h3 className="quest-title">{questData.title}</h3>
          <div className="quest-badges">
            <span 
              className="quest-type-badge" 
              style={{ backgroundColor: typeBadge.color }}
            >
              {typeBadge.label}
            </span>
            <span 
              className="quest-difficulty-badge"
              style={{ backgroundColor: difficultyColors[questData.difficulty] }}
            >
              {questData.difficulty === 'easy' && 'Facile'}
              {questData.difficulty === 'medium' && 'Moyen'}
              {questData.difficulty === 'hard' && 'Difficile'}
              {questData.difficulty === 'epic' && 'Épique'}
            </span>
          </div>
        </div>
        {timeRemaining && (
          <div className={`quest-timer ${isExpired ? 'expired' : ''}`}>
            ⏱️ {timeRemaining}
          </div>
        )}
      </div>

      <p className="quest-description">{questData.description}</p>

      <div className="quest-objective">
        <div className="objective-text">
          <span className="objective-label">Objectif:</span>
          <span className="objective-target">{questData.objective_target}</span>
        </div>
        <div className="quest-progress-bar">
          <div 
            className="quest-progress-fill"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          <span className="quest-progress-text">
            {progress} / {questData.objective_target} ({progressPercentage}%)
          </span>
        </div>
      </div>

      <div className="quest-rewards">
        <span className="rewards-label">Récompenses:</span>
        <div className="rewards-list">
          {renderRewards()}
        </div>
      </div>

      <div className="quest-actions">
        {canStart && (
          <button 
            className="quest-button quest-start-button"
            onClick={handleStartClick}
          >
            Démarrer
          </button>
        )}
        {status === 'in_progress' && !isCompleted && (
          <button className="quest-button quest-in-progress-button" disabled>
            En cours...
          </button>
        )}
        {isClaimable && (
          <button 
            className="quest-button quest-claim-button"
            onClick={handleClaimClick}
          >
            🎁 Réclamer
          </button>
        )}
        {status === 'claimed' && (
          <button className="quest-button quest-claimed-button" disabled>
            ✓ Réclamée
          </button>
        )}
        {isExpired && (
          <button className="quest-button quest-expired-button" disabled>
            Expirée
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestCard;
