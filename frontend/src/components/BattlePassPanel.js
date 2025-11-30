import React, { useState, useEffect } from 'react';
import BattlePassReward from './BattlePassReward';
import { getUserProgress, claimReward, claimAllRewards, purchasePremium } from '../api/battlepass';
import './BattlePassPanel.css';

/**
 * BattlePassPanel Component
 * Main panel for displaying and managing battle pass progression
 */
const BattlePassPanel = ({ onClose, onRewardsClaimed }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [selectedTier, setSelectedTier] = useState(1);

  /**
   * Load battle pass data
   */
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserProgress();
      setProgress(data);
      setSelectedTier(data.progress.current_tier);
    } catch (err) {
      console.error('Error loading battle pass:', err);
      setError('Impossible de charger le Battle Pass');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle claiming a single reward
   */
  const handleClaimReward = async (rewardId) => {
    try {
      setClaimingId(rewardId);
      const result = await claimReward(rewardId);
      
      if (onRewardsClaimed) {
        onRewardsClaimed(result);
      }

      await loadProgress();
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError(err.response?.data?.message || 'Échec de la réclamation');
    } finally {
      setClaimingId(null);
    }
  };

  /**
   * Handle claiming all available rewards
   */
  const handleClaimAll = async () => {
    try {
      setClaimingAll(true);
      const result = await claimAllRewards();
      
      if (onRewardsClaimed) {
        onRewardsClaimed(result);
      }

      await loadProgress();
    } catch (err) {
      console.error('Error claiming all rewards:', err);
      setError('Échec de la réclamation groupée');
    } finally {
      setClaimingAll(false);
    }
  };

  /**
   * Handle purchasing premium
   */
  const handlePurchasePremium = async () => {
    if (!window.confirm(`Acheter le Pass Premium pour ${progress.season.premium_price} gemmes ?`)) {
      return;
    }

    try {
      await purchasePremium();
      await loadProgress();
    } catch (err) {
      console.error('Error purchasing premium:', err);
      setError(err.response?.data?.message || 'Échec de l\'achat');
    }
  };

  /**
   * Get rewards for a specific tier
   */
  const getRewardsForTier = (tier) => {
    if (!progress) return { free: null, premium: null };
    
    return {
      free: progress.rewards.find(r => r.tier === tier && r.track === 'free'),
      premium: progress.rewards.find(r => r.tier === tier && r.track === 'premium')
    };
  };

  /**
   * Check if reward is claimed
   */
  const isRewardClaimed = (rewardId) => {
    return progress?.claimedRewards.some(cr => cr.reward_id === rewardId) || false;
  };

  /**
   * Check if reward can be claimed
   */
  const canClaimReward = (reward) => {
    if (!progress) return false;
    const isClaimed = isRewardClaimed(reward.id);
    const tierReached = reward.tier <= progress.progress.current_tier;
    const hasPremiumAccess = reward.track === 'free' || progress.progress.has_premium;
    return tierReached && hasPremiumAccess && !isClaimed;
  };

  if (loading) {
    return (
      <div className="battlepass-panel-overlay">
        <div className="battlepass-panel loading">
          <div className="spinner"></div>
          <p>Chargement du Battle Pass...</p>
        </div>
      </div>
    );
  }

  if (error && !progress) {
    return (
      <div className="battlepass-panel-overlay">
        <div className="battlepass-panel error">
          <p className="error-message">{error}</p>
          <button onClick={loadProgress} className="retry-button">Réessayer</button>
          <button onClick={onClose} className="close-button-text">Fermer</button>
        </div>
      </div>
    );
  }

  const { season, progress: userProgress, availableRewards } = progress;
  const xpProgress = (userProgress.current_xp / season.xp_per_tier) * 100;

  return (
    <div className="battlepass-panel-overlay">
      <div className="battlepass-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="header-content">
            <h2>🎮 Battle Pass - {season.name}</h2>
            <p className="season-description">{season.description}</p>
            <div className="season-info">
              <span className="season-number">Saison {season.season_number}</span>
              <span className="season-days">⏱️ {season.days_remaining} jours restants</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="tier-display">
            <div className="tier-info">
              <span className="tier-label">Niveau</span>
              <span className="tier-number">{userProgress.current_tier}</span>
              <span className="tier-max">/ {season.max_tier}</span>
            </div>
            <div className="xp-info">
              <span className="xp-current">{userProgress.current_xp.toLocaleString()}</span>
              <span className="xp-separator">/</span>
              <span className="xp-max">{season.xp_per_tier.toLocaleString()} XP</span>
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <span className="progress-percentage">{xpProgress.toFixed(1)}%</span>
          </div>

          <div className="completion-info">
            <span>Progression totale: {userProgress.completion_percentage.toFixed(1)}%</span>
            <span>XP Total: {userProgress.total_xp.toLocaleString()}</span>
          </div>
        </div>

        {/* Premium Status & Actions */}
        <div className="actions-section">
          {!userProgress.has_premium ? (
            <button 
              className="premium-button"
              onClick={handlePurchasePremium}
            >
              <span className="premium-icon">👑</span>
              <span>Acheter Pass Premium - {season.premium_price.toLocaleString()} 💎</span>
            </button>
          ) : (
            <div className="premium-badge">
              <span className="premium-icon">👑</span>
              <span>Pass Premium Actif</span>
            </div>
          )}

          {availableRewards.length > 0 && (
            <button 
              className="claim-all-button"
              onClick={handleClaimAll}
              disabled={claimingAll}
            >
              {claimingAll ? 'Réclamation...' : `Tout Réclamer (${availableRewards.length})`}
            </button>
          )}
        </div>

        {/* Rewards Grid */}
        <div className="rewards-section">
          <div className="tier-selector">
            <button 
              onClick={() => setSelectedTier(Math.max(1, selectedTier - 10))}
              disabled={selectedTier <= 10}
            >
              ← 10 Niveaux
            </button>
            <span>Niveau {selectedTier} - {Math.min(selectedTier + 9, season.max_tier)}</span>
            <button 
              onClick={() => setSelectedTier(Math.min(season.max_tier - 9, selectedTier + 10))}
              disabled={selectedTier >= season.max_tier - 9}
            >
              10 Niveaux →
            </button>
          </div>

          <div className="tracks-container">
            {/* Free Track */}
            <div className="track free-track">
              <div className="track-header">
                <h3>🆓 Piste Gratuite</h3>
              </div>
              <div className="track-rewards">
                {Array.from({ length: 10 }, (_, i) => {
                  const tier = selectedTier + i;
                  if (tier > season.max_tier) return null;
                  
                  const { free } = getRewardsForTier(tier);
                  if (!free) return <div key={tier} className="empty-slot">{tier}</div>;

                  return (
                    <div key={tier} className="reward-slot">
                      <div className="tier-label">Niv. {tier}</div>
                      <BattlePassReward
                        reward={free}
                        isClaimed={isRewardClaimed(free.id)}
                        canClaim={canClaimReward(free)}
                        isPremium={userProgress.has_premium}
                        onClaim={handleClaimReward}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Track */}
            <div className="track premium-track">
              <div className="track-header">
                <h3>👑 Piste Premium</h3>
              </div>
              <div className="track-rewards">
                {Array.from({ length: 10 }, (_, i) => {
                  const tier = selectedTier + i;
                  if (tier > season.max_tier) return null;
                  
                  const { premium } = getRewardsForTier(tier);
                  if (!premium) return <div key={tier} className="empty-slot">{tier}</div>;

                  return (
                    <div key={tier} className="reward-slot">
                      <div className="tier-label">Niv. {tier}</div>
                      <BattlePassReward
                        reward={premium}
                        isClaimed={isRewardClaimed(premium.id)}
                        canClaim={canClaimReward(premium)}
                        isPremium={userProgress.has_premium}
                        onClaim={handleClaimReward}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePassPanel;
