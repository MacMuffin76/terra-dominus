// quests.js - API client for quest system
import axiosInstance from '../utils/axiosInstance';

/**
 * Get user's quests
 * @param {Object} filters - Optional filters (type, status)
 * @returns {Promise} API response
 */
export const getUserQuests = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  const url = queryString ? `/quests?${queryString}` : '/quests';
  
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Assign daily quests to user
 * @returns {Promise} API response
 */
export const assignDailyQuests = async () => {
  const response = await axiosInstance.post('/quests/daily/assign');
  return response.data;
};

/**
 * Assign weekly quests to user
 * @returns {Promise} API response
 */
export const assignWeeklyQuests = async () => {
  const response = await axiosInstance.post('/quests/weekly/assign');
  return response.data;
};

/**
 * Start a quest
 * @param {number} questId - Quest ID
 * @returns {Promise} API response
 */
export const startQuest = async (questId) => {
  const response = await axiosInstance.post(`/quests/${questId}/start`);
  return response.data;
};

/**
 * Claim quest rewards
 * @param {number} questId - Quest ID
 * @returns {Promise} API response
 */
export const claimQuestRewards = async (questId) => {
  const response = await axiosInstance.post(`/quests/${questId}/claim`);
  return response.data;
};

/**
 * Get quest statistics
 * @returns {Promise} API response
 */
export const getQuestStats = async () => {
  const response = await axiosInstance.get('/quests/stats');
  return response.data;
};

/**
 * Update quest progress (testing/admin)
 * @param {number} questId - Quest ID
 * @param {number} increment - Progress increment
 * @returns {Promise} API response
 */
export const updateQuestProgress = async (questId, increment) => {
  const response = await axiosInstance.post(`/quests/${questId}/progress`, { increment });
  return response.data;
};
