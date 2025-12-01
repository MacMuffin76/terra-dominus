// frontend/src/api/facilityUnlocks.js

import axiosInstance from '../utils/axiosInstance';

/**
 * Get all facilities for current user with levels and bonuses
 * @returns {Promise<Array<{id, key, name, description, currentLevel, maxLevel, currentBonuses, nextBonuses, upgradeCost}>>}
 */
export const getPlayerFacilities = async () => {
  const { data } = await axiosInstance.get('/facilities/unlock/list');
  return data;
};

/**
 * Get detailed information about a specific facility
 * @param {string} facilityKey - Facility key (e.g., 'TRAINING_CENTER', 'RESEARCH_LAB')
 * @returns {Promise<{key, name, description, currentLevel, maxLevel, levelSummary: Array}>}
 */
export const getFacilityDetails = async (facilityKey) => {
  const { data } = await axiosInstance.get(`/facilities/unlock/details/${facilityKey}`);
  return data;
};

/**
 * Get total bonuses from all facilities
 * @returns {Promise<{facilities: Array, totalBonuses: Object, summary: Array}>}
 */
export const getTotalBonuses = async () => {
  const { data } = await axiosInstance.get('/facilities/unlock/bonuses');
  return data;
};
