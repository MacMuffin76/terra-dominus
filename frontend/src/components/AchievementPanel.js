import React, { useState, useEffect } from 'react';
import AchievementCard from './AchievementCard';
import { 
  getUserAchievements, 
  claimAchievementRewards, 
  getAchievementStats,
  getLeaderboard 
} from '../api/achievements';
import './AchievementPanel.css';

/**
 * Achievement categories
 */
const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'combat', label: 'Combat' },
  { value: 'economy', label: 'Economy' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'research', label: 'Research' },
  { value: 'social', label: 'Social' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'general', label: 'General' }
];

/**
 * Achievement tiers
 */
const TIERS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' }
];

/**
 * AchievementPanel Component
 * Main panel for displaying and managing achievements
 */
const AchievementPanel = ({ onClose, onRewardsClaimed }) => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [activeTab, setActiveTab] = useState('achievements'); // achievements | leaderboard
  const [claimingId, setClaimingId] = useState(null);

  /**
   * Load achievements and stats
   */
  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedTier]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters
      const filters = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      // Note: tier filtering not in API, will filter client-side

      // Load achievements and stats in parallel
      const [achievementsData, statsData] = await Promise.all([
        getUserAchievements(filters),
        getAchievementStats()
      ]);

      // Filter by tier client-side if needed
      let filteredAchievements = achievementsData;
      if (selectedTier !== 'all') {
        filteredAchievements = achievementsData.filter(a => a.achievement.tier === selectedTier);
      }

      setAchievements(filteredAchievements);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load leaderboard data
   */
  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  /**
   * Handle tab change
   */
  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboard.length === 0) {
      loadLeaderboard();
    }
  }, [activeTab]);

  /**
   * Handle claim rewards
   */
  const handleClaim = async (achievementId) => {
    try {
      setClaimingId(achievementId);
      const result = await claimAchievementRewards(achievementId);
      
      // Show success notification
      if (onRewardsClaimed) {
        onRewardsClaimed(result);
      }

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError('Failed to claim rewards. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  /**
   * Render statistics
   */
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-value">{stats.totalAchievements}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.unlockedAchievements}</div>
          <div className="stat-label">Unlocked</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.claimedAchievements}</div>
          <div className="stat-label">Claimed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalPoints.toLocaleString()}</div>
          <div className="stat-label">Points</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.completionPercentage.toFixed(1)}%</div>
          <div className="stat-label">Completion</div>
        </div>
      </div>
    );
  };

  /**
   * Render leaderboard
   */
  const renderLeaderboard = () => {
    if (leaderboard.length === 0) {
      return <div className="no-data">No leaderboard data available</div>;
    }

    return (
      <div className="leaderboard-container">
        <h3>🏆 Top Achievement Hunters</h3>
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => (
            <div key={entry.user_id} className={`leaderboard-entry rank-${index + 1}`}>
              <div className="rank-badge">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="player-info">
                <div className="player-name">{entry.pseudo}</div>
                <div className="player-stats">
                  {entry.total_achievements} achievements • {entry.total_points.toLocaleString()} points
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="achievement-panel-overlay">
      <div className="achievement-panel">
        {/* Header */}
        <div className="panel-header">
          <h2>🏆 Achievements</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button 
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>

        {/* Statistics */}
        {activeTab === 'achievements' && renderStats()}

        {/* Filters */}
        {activeTab === 'achievements' && (
          <div className="filters-container">
            <div className="filter-group">
              <label>Category:</label>
              <div className="category-buttons">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    className={`filter-button ${selectedCategory === cat.value ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Tier:</label>
              <select 
                value={selectedTier} 
                onChange={(e) => setSelectedTier(e.target.value)}
                className="tier-select"
              >
                {TIERS.map(tier => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="panel-content">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading achievements...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={loadData} className="retry-button">Retry</button>
            </div>
          )}

          {!loading && !error && activeTab === 'achievements' && (
            <>
              {achievements.length === 0 ? (
                <div className="no-achievements">
                  <p>No achievements found with the selected filters.</p>
                </div>
              ) : (
                <div className="achievements-grid">
                  {achievements.map(({ achievement, ...userAchievement }) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      userAchievement={userAchievement}
                      onClaim={handleClaim}
                      disabled={claimingId === achievement.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && activeTab === 'leaderboard' && renderLeaderboard()}
        </div>
      </div>
    </div>
  );
};

export default AchievementPanel;
