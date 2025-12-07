/**
 * Legacy Quest API Client
 * API calls for the original quest system (/api/v1/quests)
 * Used by QuestPanel component
 */

import axiosInstance from '../utils/axiosInstance';

const BASE_URL = '/quests';

/**
 * Get user's quests
 */
export const getUserQuests = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

/**
 * Get quest statistics
 */
export const getQuestStats = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/stats`);
  return response.data;
};

/**
 * Assign daily quests to user
 */
export const assignDailyQuests = async () => {
  const response = await axiosInstance.post(`${BASE_URL}/daily/assign`);
  return response.data;
};

/**
 * Assign weekly quests to user
 */
export const assignWeeklyQuests = async () => {
  const response = await axiosInstance.post(`${BASE_URL}/weekly/assign`);
  return response.data;
};

/**
 * Start a quest
 */
export const startQuest = async (questId) => {
  const response = await axiosInstance.post(`${BASE_URL}/${questId}/start`);
  return response.data;
};

/**
 * Claim quest rewards
 */
export const claimQuestRewards = async (questId) => {
  const response = await axiosInstance.post(`${BASE_URL}/${questId}/claim`);
  return response.data;
};

/**
 * Update quest progress (testing/admin)
 */
export const updateQuestProgress = async (questId, progressData) => {
  const response = await axiosInstance.post(`${BASE_URL}/${questId}/progress`, progressData);
  return response.data;
};
