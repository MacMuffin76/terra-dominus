/**
 * useQuests Hook
 * Custom hook for quest system state management
 */

import { useState, useEffect, useCallback } from 'react';
import questAPI from '../api/quests';

export const useQuests = () => {
  const [activeQuests, setActiveQuests] = useState([]);
  const [questStats, setQuestStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load active quests
  const loadActiveQuests = useCallback(async () => {
    try {
      const response = await questAPI.getActiveQuests();
      setActiveQuests(response.quests || []);
    } catch (err) {
      console.error('Failed to load active quests:', err);
    }
  }, []);

  // Load quest stats
  const loadQuestStats = useCallback(async () => {
    try {
      const response = await questAPI.getQuestStats();
      setQuestStats(response.stats);
    } catch (err) {
      console.error('Failed to load quest stats:', err);
    }
  }, []);

  // Load streak
  const loadStreak = useCallback(async () => {
    try {
      const response = await questAPI.getStreak();
      setStreak(response.streak);
    } catch (err) {
      console.error('Failed to load streak:', err);
    }
  }, []);

  // Accept quest
  const acceptQuest = useCallback(async (questId) => {
    setLoading(true);
    setError(null);

    try {
      await questAPI.acceptQuest(questId);
      await loadActiveQuests();
      
      setNotification({
        type: 'new_quest',
        quest: { title: 'Quest accepted!' },
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept quest');
    } finally {
      setLoading(false);
    }
  }, [loadActiveQuests]);

  // Claim rewards
  const claimRewards = useCallback(async (questId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await questAPI.claimRewards(questId);
      await loadActiveQuests();
      await loadQuestStats();
      await loadStreak();

      setNotification({
        type: 'reward_claimed',
        quest: { title: 'Quest Complete!' },
        rewards: response.rewards,
      });

      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  }, [loadActiveQuests, loadQuestStats, loadStreak]);

  // Update quest progress (called from game events)
  const updateQuestProgress = useCallback((objectiveType, value = 1, metadata = {}) => {
    // Find quests with matching objectives
    const updatedQuests = activeQuests.filter(quest => {
      return quest.progress?.some(obj => obj.type === objectiveType);
    });

    if (updatedQuests.length > 0) {
      // Reload active quests to get updated progress
      loadActiveQuests();

      // Show progress notification
      setNotification({
        type: 'progress',
        progress: {
          description: objectiveType,
          current: value,
        },
      });

      setTimeout(() => setNotification(null), 3000);
    }
  }, [activeQuests, loadActiveQuests]);

  // Check for completed quests
  useEffect(() => {
    const completedQuests = activeQuests.filter(q => q.all_complete && !q.rewards_claimed);
    
    if (completedQuests.length > 0) {
      setNotification({
        type: 'completed',
        quest: completedQuests[0].quest,
      });

      setTimeout(() => setNotification(null), 5000);
    }
  }, [activeQuests]);

  // Initial load
  useEffect(() => {
    loadActiveQuests();
    loadQuestStats();
    loadStreak();
  }, [loadActiveQuests, loadQuestStats, loadStreak]);

  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveQuests();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadActiveQuests]);

  return {
    activeQuests,
    questStats,
    streak,
    notification,
    loading,
    error,
    acceptQuest,
    claimRewards,
    updateQuestProgress,
    refresh: loadActiveQuests,
    clearNotification: () => setNotification(null),
  };
};

export default useQuests;
