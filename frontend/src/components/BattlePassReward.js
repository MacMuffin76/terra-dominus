import React from 'react';
import './BattlePassReward.css';

/**
 * Reward type icons
 */
const REWARD_TYPE_ICONS = {
  resources: '📦',
  xp: '⭐',
  gems: '💎',
  units: '⚔️',
  buildings: '🏗️',
  boost: '⚡',
  cosmetic: '🎭',
  blueprint: '📐',
  item: '🎁'
};

/**
 * BattlePassReward Component
 * Displays a single reward in the battle pass
 */
const BattlePassReward = ({ reward, isClaimed, canClaim, isPremium, onClaim }) => {
  const {
    id,
    tier,
    track,
    reward_type,
    reward_data,
    display_name,
    display_icon,
    is_highlight
  } = reward;

  const isLocked = !canClaim;
  const needsPremium = track === 'premium' && !isPremium;

  const handleClick = () => {
    if (canClaim && !isClaimed && onClaim) {
      onClaim(id);
    }
  };

  // Format reward details for display
  const getRewardDetails = () => {
    switch (reward_type) {
      case 'resources':
        const resources = [];
        if (reward_data.or) resources.push(`🪙 ${reward_data.or.toLocaleString()}`);
        if (reward_data.metal) resources.push(`⚙️ ${reward_data.metal.toLocaleString()}`);
        if (reward_data.carburant) resources.push(`⛽ ${reward_data.carburant.toLocaleString()}`);
        return resources.join(' ');
      
      case 'xp':
        return `${reward_data.amount?.toLocaleString() || 0} XP`;
      
      case 'gems':
        return `${reward_data.amount?.toLocaleString() || 0} Gemmes`;
      
      case 'units':
        return `${reward_data.quantity || 0}x ${reward_data.type || 'Unités'}`;
      
      case 'boost':
        return `${reward_data.multiplier}x ${reward_data.type} (${reward_data.duration / 3600}h)`;
      
      case 'cosmetic':
        return reward_data.title || reward_data.type || 'Cosmétique';
      
      default:
        return display_name;
    }
  };

  return (
    <div 
      className={`battlepass-reward ${track} ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''} ${is_highlight ? 'highlight' : ''} ${needsPremium ? 'needs-premium' : ''}`}
      onClick={handleClick}
      style={{ cursor: canClaim && !isClaimed ? 'pointer' : 'default' }}
    >
      {/* Premium Lock Indicator */}
      {needsPremium && (
        <div className="premium-lock">
          <span className="lock-icon">🔒</span>
        </div>
      )}

      {/* Reward Icon */}
      <div className="reward-icon">
        {display_icon || REWARD_TYPE_ICONS[reward_type] || '🎁'}
      </div>

      {/* Reward Name */}
      <div className="reward-name">
        {display_name}
      </div>

      {/* Reward Details */}
      <div className="reward-details">
        {getRewardDetails()}
      </div>

      {/* Status Badge */}
      {isClaimed && (
        <div className="claimed-badge">
          <span>✓</span>
        </div>
      )}

      {canClaim && !isClaimed && !needsPremium && (
        <div className="claim-indicator">
          <span className="pulse-dot"></span>
        </div>
      )}

      {/* Highlight Glow */}
      {is_highlight && !isClaimed && (
        <div className="highlight-glow"></div>
      )}
    </div>
  );
};

export default BattlePassReward;
