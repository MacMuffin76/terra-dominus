/**
 * PortalQuestPanel Component
 * Displays portal-related quests (tutorial, daily, weekly, campaign)
 */

import React, { useState, useEffect } from 'react';
import { 
  getAvailableQuests, 
  getDailyQuests, 
  getStoryProgress,
  getActiveQuests,
  acceptQuest,
  claimQuestRewards
} from '../../api/quests';
import { getApiErrorMessage } from '../../utils/apiErrorHandler';
import './PortalQuestPanel.css';

const QUEST_TYPE_LABELS = {
  tutorial: { label: 'Tutoriel', color: '#00D9FF', icon: '📘' },
  daily: { label: 'Quotidienne', color: '#FFD700', icon: '⭐' },
  weekly: { label: 'Hebdomadaire', color: '#9933FF', icon: '👑' },
  campaign: { label: 'Campagne', color: '#FF6B35', icon: '🏆' },
  achievement: { label: 'Succès', color: '#00FF00', icon: '🎯' }
};

const PortalQuestPanel = () => {
  const [activeTab, setActiveTab] = useState('available'); // available | daily | campaign | active
  const [availableQuests, setAvailableQuests] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [storyProgress, setStoryProgress] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    loadQuests();
  }, [activeTab]);

  // Listen for quest progress updates (e.g., from portal battles)
  useEffect(() => {
    const handleQuestUpdate = (event) => {
      console.log('Quest progress update received:', event.detail);
      loadQuests();
    };

    window.addEventListener('questProgressUpdate', handleQuestUpdate);
    return () => {
      window.removeEventListener('questProgressUpdate', handleQuestUpdate);
    };
  }, [activeTab]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'available') {
        const data = await getAvailableQuests();
        setAvailableQuests(data.data || data || []);
      } else if (activeTab === 'daily') {
        const data = await getDailyQuests();
        setDailyQuests(data.data || data || []);
      } else if (activeTab === 'campaign') {
        const data = await getStoryProgress();
        setStoryProgress(data.data || data || null);
      } else if (activeTab === 'active') {
        const data = await getActiveQuests();
        setActiveQuests(data.data || data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading quests:', err);
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des quêtes'));
      setLoading(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    try {
      await acceptQuest(questId);
      setError(null);
      await loadQuests();
      // Show success message
      alert('Quête acceptée !');
    } catch (err) {
      console.error('Error accepting quest:', err);
      setError(getApiErrorMessage(err, 'Erreur lors de l\'acceptation de la quête'));
    }
  };

  const handleClaimRewards = async (questId) => {
    try {
      const result = await claimQuestRewards(questId);
      setError(null);
      await loadQuests();
      // Show rewards
      alert(`Récompenses réclamées ! +${result.data?.rewards?.xp || 0} XP`);
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(getApiErrorMessage(err, 'Erreur lors de la réclamation des récompenses'));
    }
  };

  const renderQuestCard = (quest, userQuest = null) => {
    const questType = QUEST_TYPE_LABELS[quest.quest_type] || QUEST_TYPE_LABELS.campaign;
    const progress = userQuest?.progress || [];
    const isCompleted = userQuest?.status === 'completed';
    const isActive = userQuest?.status === 'active';
    const canClaim = isCompleted && !userQuest?.rewards_claimed;

    // Calculate overall progress percentage
    let totalProgress = 0;
    if (progress.length > 0) {
      totalProgress = progress.reduce((sum, obj) => {
        const percent = (obj.current / obj.target) * 100;
        return sum + percent;
      }, 0) / progress.length;
    }

    return (
      <div 
        key={quest.quest_id} 
        className={`quest-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
        onClick={() => setSelectedQuest(quest)}
      >
        <div className="quest-card-header">
          <div className="quest-type-badge" style={{ backgroundColor: questType.color }}>
            <span className="quest-icon">{questType.icon}</span>
            <span className="quest-type-label">{questType.label}</span>
          </div>
          {quest.difficulty && (
            <div className="quest-difficulty">
              {'⭐'.repeat(quest.difficulty)}
            </div>
          )}
        </div>

        <h3 className="quest-title">{quest.title}</h3>
        <p className="quest-description">{quest.description}</p>

        {/* Objectives */}
        {quest.objectives && quest.objectives.length > 0 && (
          <div className="quest-objectives">
            {quest.objectives.map((obj, idx) => {
              const progressObj = progress.find(p => p.type === obj.type);
              const current = progressObj?.current || 0;
              const target = obj.target;
              const percent = Math.min(100, (current / target) * 100);

              return (
                <div key={idx} className="objective-item">
                  <div className="objective-text">
                    {obj.description}
                  </div>
                  <div className="objective-progress-bar">
                    <div 
                      className="objective-progress-fill" 
                      style={{ width: `${percent}%` }}
                    ></div>
                    <span className="objective-progress-text">
                      {current} / {target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Overall Progress */}
        {isActive && progress.length > 0 && (
          <div className="quest-overall-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
            <span className="progress-percent">{Math.round(totalProgress)}%</span>
          </div>
        )}

        {/* Rewards */}
        {quest.rewards && (
          <div className="quest-rewards">
            <div className="rewards-label">Récompenses:</div>
            <div className="rewards-list">
              {quest.rewards.gold && (
                <span className="reward-item">💰 {quest.rewards.gold.toLocaleString()}</span>
              )}
              {quest.rewards.experience && (
                <span className="reward-item">⚡ {quest.rewards.experience} XP</span>
              )}
              {quest.rewards.blueprints && quest.rewards.blueprints.length > 0 && (
                <span className="reward-item">📜 {quest.rewards.blueprints.length} Blueprint(s)</span>
              )}
              {quest.rewards.unlocks && quest.rewards.unlocks.length > 0 && (
                <span className="reward-item">🔓 Unlock(s)</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="quest-actions">
          {!isActive && !isCompleted && (
            <button 
              className="btn-accept-quest"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptQuest(quest.quest_id);
              }}
            >
              Accepter
            </button>
          )}
          {canClaim && (
            <button 
              className="btn-claim-rewards"
              onClick={(e) => {
                e.stopPropagation();
                handleClaimRewards(quest.quest_id);
              }}
            >
              Réclamer les récompenses
            </button>
          )}
          {isCompleted && userQuest?.rewards_claimed && (
            <div className="quest-completed-badge">✓ Terminée</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="portal-quest-panel">
        <div className="quest-loading">
          <div className="spinner"></div>
          <p>Chargement des quêtes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-quest-panel">
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="quest-tabs">
        <button
          className={`quest-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          En cours ({activeQuests.length})
        </button>
        <button
          className={`quest-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Disponibles
        </button>
        <button
          className={`quest-tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          ⭐ Quotidiennes
        </button>
        <button
          className={`quest-tab ${activeTab === 'campaign' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaign')}
        >
          🏆 Campagne
        </button>
      </div>

      <div className="quest-content">
        {activeTab === 'active' && (
          <div className="quest-list">
            {activeQuests.length === 0 ? (
              <div className="no-quests">
                <p>Aucune quête en cours.</p>
                <button onClick={() => setActiveTab('available')}>
                  Voir les quêtes disponibles
                </button>
              </div>
            ) : (
              activeQuests.map(uq => renderQuestCard(uq.quest, uq))
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="quest-list">
            {availableQuests.length === 0 ? (
              <div className="no-quests">
                <p>Aucune quête disponible pour le moment.</p>
              </div>
            ) : (
              availableQuests.map(quest => renderQuestCard(quest))
            )}
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="quest-list">
            <div className="daily-quests-header">
              <h3>🌟 Quêtes Quotidiennes</h3>
              <p>Complétez ces quêtes aujourd'hui pour gagner des bonus !</p>
            </div>
            {dailyQuests.length === 0 ? (
              <div className="no-quests">
                <p>Aucune quête quotidienne disponible.</p>
              </div>
            ) : (
              dailyQuests.map(quest => renderQuestCard(quest.quest, quest.user_quest))
            )}
          </div>
        )}

        {activeTab === 'campaign' && storyProgress && (
          <div className="campaign-panel">
            <div className="campaign-header">
              <h3>📖 Campagne des Portails</h3>
              <p>Progression de l'histoire et déblocage de nouveaux tiers</p>
            </div>

            {/* Current Chapter */}
            {storyProgress.current_chapter && (
              <div className="current-chapter">
                <h4>Chapitre {storyProgress.current_chapter.chapter_number}: {storyProgress.current_chapter.title}</h4>
                <div className="chapter-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${storyProgress.current_chapter.completion_percent || 0}%` }}
                    ></div>
                  </div>
                  <span>{storyProgress.current_chapter.completed_quests || 0} / {storyProgress.current_chapter.total_quests || 0} quêtes</span>
                </div>
              </div>
            )}

            {/* Next Quest */}
            {storyProgress.next_quest && (
              <div className="next-quest-highlight">
                <h4>🎯 Prochaine Quête</h4>
                {renderQuestCard(storyProgress.next_quest)}
              </div>
            )}

            {/* All Story Quests */}
            {storyProgress.all_quests && storyProgress.all_quests.length > 0 && (
              <div className="all-story-quests">
                <h4>Toutes les quêtes de campagne</h4>
                <div className="quest-list">
                  {storyProgress.all_quests.map(questData => 
                    renderQuestCard(questData.quest, questData.user_quest)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quest Detail Modal */}
      {selectedQuest && (
        <div className="quest-detail-modal" onClick={() => setSelectedQuest(null)}>
          <div className="quest-detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedQuest(null)}>×</button>
            <h2>{selectedQuest.title}</h2>
            <p>{selectedQuest.description}</p>
            {/* Add more detailed quest info here */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalQuestPanel;
