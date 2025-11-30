import axiosInstance from '../utils/axiosInstance';

/**
 * Achievement API Client
 * Handles all achievement-related API requests
 */

/**
 * Get all available achievements with optional filters
 * @param {Object} filters - Optional filters { category, tier }
 * @returns {Promise<Array>} Array of achievement definitions
 */
export const getAllAchievements = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.tier) params.append('tier', filters.tier);
    
    const queryString = params.toString();
    const url = queryString ? `/achievements?${queryString}` : '/achievements';
    
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

/**
 * Get user's achievement progress with optional filters
 * @param {Object} filters - Optional filters { category, unlocked, claimed }
 * @returns {Promise<Array>} Array of user achievements with progress
 */
export const getUserAchievements = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.unlocked !== undefined) params.append('unlocked', filters.unlocked);
    if (filters.claimed !== undefined) params.append('claimed', filters.claimed);
    
    const queryString = params.toString();
    const url = queryString ? `/achievements/user?${queryString}` : '/achievements/user';
    
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    throw error;
  }
};

/**
 * Claim rewards for an unlocked achievement
 * @param {number} achievementId - Achievement ID to claim
 * @returns {Promise<Object>} Claim result with rewards and updated user data
 */
export const claimAchievementRewards = async (achievementId) => {
  try {
    const response = await axiosInstance.post(`/achievements/${achievementId}/claim`);
    return response.data;
  } catch (error) {
    console.error('Error claiming achievement rewards:', error);
    throw error;
  }
};

/**
 * Get user's achievement statistics
 * @returns {Promise<Object>} Statistics object with totals and progress
 */
export const getAchievementStats = async () => {
  try {
    const response = await axiosInstance.get('/achievements/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    throw error;
  }
};

/**
 * Get achievement leaderboard
 * @param {number} limit - Number of top users to retrieve (default: 10)
 * @returns {Promise<Array>} Array of leaderboard entries with user data
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await axiosInstance.get(`/achievements/leaderboard?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};
