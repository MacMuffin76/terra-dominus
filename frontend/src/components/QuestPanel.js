// QuestPanel.js - Main quest panel component
import React, { useState, useEffect } from 'react';
import QuestCard from './QuestCard';
import { 
  getUserQuests, 
  assignDailyQuests, 
  assignWeeklyQuests,
  claimQuestRewards,
  startQuest,
  getQuestStats
} from '../api/quests';
import './QuestPanel.css';

const QuestPanel = ({ onRewardsClaimed }) => {
  const [quests, setQuests] = useState([]);
  const [stats, setStats] = useState({
    available: 0,
    in_progress: 0,
    completed: 0,
    claimed: 0
  });
  const [activeTab, setActiveTab] = useState('all'); // all, daily, weekly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingQuest, setClaimingQuest] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadQuests();
    loadStats();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserQuests();
      setQuests(response.quests || []);
    } catch (err) {
      console.error('Failed to load quests:', err);
      setError('Impossible de charger les quêtes. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getQuestStats();
      setStats(response.stats || {});
    } catch (err) {
      console.error('Failed to load quest stats:', err);
    }
  };

  const handleAssignDaily = async () => {
    try {
      setError(null);
      const response = await assignDailyQuests();
      
      if (response.success) {
        showNotification(`${response.quests.length} quête(s) quotidienne(s) assignée(s)`, 'success');
        await loadQuests();
        await loadStats();
      }
    } catch (err) {
      console.error('Failed to assign daily quests:', err);
      showNotification('Impossible d\'assigner les quêtes quotidiennes', 'error');
    }
  };

  const handleAssignWeekly = async () => {
    try {
      setError(null);
      const response = await assignWeeklyQuests();
      
      if (response.success) {
        showNotification(`${response.quests.length} quête(s) hebdomadaire(s) assignée(s)`, 'success');
        await loadQuests();
        await loadStats();
      }
    } catch (err) {
      console.error('Failed to assign weekly quests:', err);
      showNotification('Impossible d\'assigner les quêtes hebdomadaires', 'error');
    }
  };

  const handleClaimRewards = async (questId) => {
    try {
      setClaimingQuest(questId);
      const response = await claimQuestRewards(questId);
      
      if (response.success) {
        const { rewards, leveledUp, newLevel } = response;
        
        let message = 'Récompenses réclamées ! ';
        if (rewards.or > 0) message += `+${rewards.or} 💰 `;
        if (rewards.metal > 0) message += `+${rewards.metal} ⚙️ `;
        if (rewards.carburant > 0) message += `+${rewards.carburant} ⛽ `;
        if (rewards.xp > 0) message += `+${rewards.xp} XP `;
        
        if (leveledUp) {
          message += `\n🎉 Niveau ${newLevel} atteint !`;
        }
        
        showNotification(message, 'success');
        
        // Notify parent component to refresh resources
        if (onRewardsClaimed) {
          onRewardsClaimed(rewards);
        }
        
        await loadQuests();
        await loadStats();
      }
    } catch (err) {
      console.error('Failed to claim rewards:', err);
      const errorMsg = err.response?.data?.message || 'Impossible de réclamer les récompenses';
      showNotification(errorMsg, 'error');
    } finally {
      setClaimingQuest(null);
    }
  };

  const handleStartQuest = async (questId) => {
    try {
      const response = await startQuest(questId);
      
      if (response.success) {
        showNotification('Quête démarrée !', 'success');
        await loadQuests();
        await loadStats();
      }
    } catch (err) {
      console.error('Failed to start quest:', err);
      const errorMsg = err.response?.data?.message || 'Impossible de démarrer la quête';
      showNotification(errorMsg, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const filterQuests = (questList) => {
    if (activeTab === 'all') return questList;
    if (activeTab === 'daily') return questList.filter(q => q.quest.type === 'daily');
    if (activeTab === 'weekly') return questList.filter(q => q.quest.type === 'weekly');
    return questList;
  };

  const filteredQuests = filterQuests(quests);
  const dailyQuests = quests.filter(q => q.quest.type === 'daily');
  const weeklyQuests = quests.filter(q => q.quest.type === 'weekly');

  const canAssignDaily = dailyQuests.filter(q => 
    q.status === 'in_progress' || q.status === 'available'
  ).length < 3;

  const canAssignWeekly = weeklyQuests.filter(q => 
    q.status === 'in_progress' || q.status === 'available'
  ).length < 2;

  return (
    <div className="quest-panel">
      <div className="quest-panel-header">
        <h2 className="quest-panel-title">
          <span className="title-icon">📋</span>
          Quêtes
        </h2>
        
        <div className="quest-stats-summary">
          <div className="stat-item">
            <span className="stat-value">{stats.in_progress}</span>
            <span className="stat-label">En cours</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Complétées</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.claimed}</span>
            <span className="stat-label">Réclamées</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`quest-notification quest-notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="quest-actions-bar">
        <button 
          className="assign-button assign-daily-button"
          onClick={handleAssignDaily}
          disabled={!canAssignDaily || loading}
        >
          <span className="button-icon">🌅</span>
          Nouvelles quêtes quotidiennes
        </button>
        <button 
          className="assign-button assign-weekly-button"
          onClick={handleAssignWeekly}
          disabled={!canAssignWeekly || loading}
        >
          <span className="button-icon">📅</span>
          Nouvelles quêtes hebdomadaires
        </button>
        <button 
          className="refresh-button"
          onClick={loadQuests}
          disabled={loading}
        >
          <span className="button-icon">🔄</span>
          Actualiser
        </button>
      </div>

      <div className="quest-tabs">
        <button
          className={`quest-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Toutes ({quests.length})
        </button>
        <button
          className={`quest-tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Quotidiennes ({dailyQuests.length})
        </button>
        <button
          className={`quest-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Hebdomadaires ({weeklyQuests.length})
        </button>
      </div>

      {error && (
        <div className="quest-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="quest-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des quêtes...</p>
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="quest-empty">
          <div className="empty-icon">📭</div>
          <h3>Aucune quête disponible</h3>
          <p>Assignez de nouvelles quêtes pour commencer !</p>
        </div>
      ) : (
        <div className="quest-list">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={handleClaimRewards}
              onStart={handleStartQuest}
              claiming={claimingQuest === quest.quest_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestPanel;
