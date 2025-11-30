import React from 'react';
import './AchievementCard.css';

/**
 * Tier color mappings
 */
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF'
};

/**
 * AchievementCard Component
 * Displays a single achievement with progress, rewards, and claim functionality
 */
const AchievementCard = ({ achievement, userAchievement, onClaim }) => {
  const {
    id,
    title,
    description,
    category,
    tier,
    objective_target,
    reward_or,
    reward_metal,
    reward_carburant,
    reward_xp,
    reward_title,
    points,
    icon,
    is_secret
  } = achievement;

  const progress = userAchievement?.progress || 0;
  const progressPercentage = userAchievement?.progressPercentage || 0;
  const isUnlocked = userAchievement?.unlocked_at !== null;
  const isClaimed = userAchievement?.claimed_at !== null;
  const isSecret = is_secret && !isUnlocked;

  // Format numbers with commas
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  // Handle claim button click
  const handleClaim = () => {
    if (onClaim && isUnlocked && !isClaimed) {
      onClaim(id);
    }
  };

  return (
    <div className={`achievement-card ${tier} ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''} ${isSecret ? 'secret' : ''}`}>
      {/* Tier Badge */}
      <div 
        className="tier-badge" 
        style={{ backgroundColor: TIER_COLORS[tier] }}
      >
        {tier.toUpperCase()}
      </div>

      {/* Achievement Icon */}
      <div className="achievement-icon">
        {icon ? (
          <span className="icon-emoji">{icon}</span>
        ) : (
          <span className="icon-default">🏆</span>
        )}
      </div>

      {/* Achievement Content */}
      <div className="achievement-content">
        <h3 className="achievement-title">
          {isSecret ? '???' : title}
        </h3>
        <p className="achievement-description">
          {isSecret ? 'Secret achievement - unlock to reveal' : description}
        </p>
        
        {/* Category & Points */}
        <div className="achievement-meta">
          <span className="category-badge">{category}</span>
          <span className="points-badge">{points} pts</span>
        </div>

        {/* Progress Bar */}
        {!isSecret && (
          <div className="progress-container">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: TIER_COLORS[tier]
                }}
              />
            </div>
            <div className="progress-text">
              {progress} / {objective_target} ({progressPercentage.toFixed(0)}%)
            </div>
          </div>
        )}

        {/* Rewards */}
        {!isSecret && (
          <div className="rewards-container">
            <h4>Rewards:</h4>
            <div className="rewards-list">
              {reward_or > 0 && (
                <span className="reward-item gold">
                  🪙 {formatNumber(reward_or)}
                </span>
              )}
              {reward_metal > 0 && (
                <span className="reward-item metal">
                  ⚙️ {formatNumber(reward_metal)}
                </span>
              )}
              {reward_carburant > 0 && (
                <span className="reward-item fuel">
                  ⛽ {formatNumber(reward_carburant)}
                </span>
              )}
              {reward_xp > 0 && (
                <span className="reward-item xp">
                  ⭐ {formatNumber(reward_xp)} XP
                </span>
              )}
              {reward_title && (
                <span className="reward-item title">
                  🎖️ "{reward_title}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Claim Button */}
        {isUnlocked && !isClaimed && (
          <button 
            className="claim-button"
            onClick={handleClaim}
            style={{ backgroundColor: TIER_COLORS[tier] }}
          >
            Claim Rewards
          </button>
        )}

        {/* Status Indicators */}
        {isClaimed && (
          <div className="status-indicator claimed">
            ✓ Claimed
          </div>
        )}
        {isUnlocked && !isClaimed && (
          <div className="status-indicator unlocked">
            🔓 Unlocked
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;
