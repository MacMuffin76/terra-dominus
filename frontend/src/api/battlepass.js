import axiosInstance from '../utils/axiosInstance';

/**
 * Battle Pass API Client
 * Handles all battle pass related API requests
 */

/**
 * Get active season information
 */
export const getActiveSeason = async () => {
  try {
    const response = await axiosInstance.get('/battlepass');
    return response.data;
  } catch (error) {
    console.error('Error fetching active season:', error);
    throw error;
  }
};

/**
 * Get user's battle pass progress
 */
export const getUserProgress = async () => {
  try {
    const response = await axiosInstance.get('/battlepass/progress');
    return response.data;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

/**
 * Add XP to battle pass
 * @param {number} amount - XP amount to add
 * @param {string} source - Source of XP (optional)
 */
export const addXP = async (amount, source = 'manual') => {
  try {
    const response = await axiosInstance.post('/battlepass/xp', { amount, source });
    return response.data;
  } catch (error) {
    console.error('Error adding XP:', error);
    throw error;
  }
};

/**
 * Claim a specific reward
 * @param {number} rewardId - Reward ID to claim
 */
export const claimReward = async (rewardId) => {
  try {
    const response = await axiosInstance.post(`/battlepass/rewards/${rewardId}/claim`);
    return response.data;
  } catch (error) {
    console.error('Error claiming reward:', error);
    throw error;
  }
};

/**
 * Claim all available rewards
 */
export const claimAllRewards = async () => {
  try {
    const response = await axiosInstance.post('/battlepass/rewards/claim-all');
    return response.data;
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    throw error;
  }
};

/**
 * Purchase premium battle pass
 */
export const purchasePremium = async () => {
  try {
    const response = await axiosInstance.post('/battlepass/premium/purchase');
    return response.data;
  } catch (error) {
    console.error('Error purchasing premium:', error);
    throw error;
  }
};

/**
 * Get battle pass leaderboard
 * @param {number} limit - Number of top players to retrieve
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await axiosInstance.get(`/battlepass/leaderboard?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};
