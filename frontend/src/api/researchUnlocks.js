// frontend/src/api/researchUnlocks.js

import axiosInstance from '../utils/axiosInstance';

/**
 * Get available research (available, in progress, completed, locked) for current user
 * @returns {Promise<{available: Array, inProgress: Array, completed: Array, locked: Array, buildings: Object, categories: Object}>}
 */
export const getAvailableResearch = async () => {
  const { data } = await axiosInstance.get('/research/unlock/available');
  return data;
};

/**
 * Check if specific research is available
 * @param {string} researchId - Research identifier (e.g., 'military_training_1', 'heavy_armor')
 * @returns {Promise<{isAvailable: boolean, reason?: string, missingRequirements?: Array}>}
 */
export const checkResearchAvailability = async (researchId) => {
  const { data } = await axiosInstance.get(`/research/unlock/check/${researchId}`);
  return data;
};

/**
 * Get research by category
 * @param {string} category - Category name (ECONOMY, MILITARY_INFANTRY, etc.)
 * @returns {Promise<{available: Array, inProgress: Array, completed: Array, locked: Array}>}
 */
export const getResearchByCategory = async (category) => {
  const { data } = await axiosInstance.get(`/research/unlock/category/${category}`);
  return data;
};
