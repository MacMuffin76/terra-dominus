// frontend/src/components/units/TierProgressBar.js

import React from 'react';
import { TrendingUp } from 'lucide-react';
import './TierProgressBar.css';

/**
 * Progress bar showing advancement toward next tier
 */
const TierProgressBar = ({ currentLevel, tierProgress, nextUnlock }) => {
  if (!tierProgress) {
    return null;
  }

  console.log('TierProgressBar full data:', JSON.stringify(tierProgress, null, 2));

  let { currentTier, nextTier, progress, levelsToNext } = tierProgress;

  // Si currentTier ou nextTier sont des objets, extraire le numéro
  if (typeof currentTier === 'object' && currentTier !== null) {
    currentTier = currentTier.number || currentTier.tier || 0;
  }
  if (typeof nextTier === 'object' && nextTier !== null) {
    nextTier = nextTier.number || nextTier.tier || 0;
  }

  // Validation
  if (currentTier === undefined || nextTier === undefined || progress === undefined || levelsToNext === undefined) {
    console.warn('TierProgressBar: Invalid data after parsing', { currentTier, nextTier, progress, levelsToNext });
    return null;
  }

  const getTierColor = (tierNum) => {
    switch (tierNum) {
      case 1:
        return '#9E9E9E';
      case 2:
        return '#4CAF50';
      case 3:
        return '#2196F3';
      case 4:
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const currentColor = getTierColor(currentTier);
  const nextColor = getTierColor(nextTier);

  return (
    <div className="tier-progress-container">
      <div className="progress-header">
        <div className="current-tier">
          <span className="tier-label" style={{ color: currentColor }}>
            Tier {Number(currentTier)}: {currentTier === 1 ? 'Basic' : currentTier === 2 ? 'Advanced' : currentTier === 3 ? 'Elite' : 'Experimental'}
          </span>
        </div>
        <div className="progress-stats">
          <TrendingUp size={16} />
          <span>Niveau {Number(currentLevel)}</span>
        </div>
        <div className="next-tier">
          <span className="tier-label" style={{ color: nextColor }}>
            Tier {Number(nextTier)}: {nextTier === 2 ? 'Advanced' : nextTier === 3 ? 'Elite' : nextTier === 4 ? 'Experimental' : 'Max'}
          </span>
        </div>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Number(progress)}%`,
              background: `linear-gradient(90deg, ${currentColor} 0%, ${nextColor} 100%)`
            }}
          >
            <div className="progress-shine"></div>
          </div>
        </div>
        <div className="progress-label">
          {Math.round(Number(progress) || 0)}% - {Math.abs(Number(levelsToNext) || 0)} niveau{Math.abs(levelsToNext) > 1 ? 'x' : ''} jusqu'au prochain tier
        </div>
      </div>
    </div>
  );
};

export default TierProgressBar;
