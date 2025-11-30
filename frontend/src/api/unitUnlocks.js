// frontend/src/api/unitUnlocks.js

import axiosInstance from '../utils/axiosInstance';

/**
 * Get available units (unlocked + locked) for current user
 * @returns {Promise<{unlocked: Array, locked: Array, nextUnlock: Object, currentLevel: number, tierProgress: Object}>}
 */
export const getAvailableUnits = async () => {
  const { data } = await axiosInstance.get('/units/unlock/available');
  return data;
};

/**
 * Check if specific unit is unlocked
 * @param {string} unitId - Unit identifier (e.g., 'cavalry', 'tanks')
 * @returns {Promise<{unlocked: boolean, reason?: string, requiredLevel?: number}>}
 */
export const checkUnitUnlock = async (unitId) => {
  const { data } = await axiosInstance.get(`/units/unlock/check/${unitId}`);
  return data;
};

/**
 * Get all tiers summary with progression
 * @returns {Promise<Array<{tier: number, name: string, unlockLevel: number, isUnlocked: boolean, units: Array}>>}
 */
export const getTiersSummary = async () => {
  const { data } = await axiosInstance.get('/units/unlock/tiers');
  return data;
};

/**
 * Get upkeep report for current user
 * @returns {Promise<{upkeep: Object, income: Object, net: Object, warnings: Array}>}
 */
export const getUpkeepReport = async () => {
  const { data } = await axiosInstance.get('/upkeep/report');
  return data;
};

/**
 * Get city upkeep details
 * @param {number} cityId
 * @returns {Promise<{gold: number, metal: number, fuel: number, units: Array}>}
 */
export const getCityUpkeep = async (cityId) => {
  const { data } = await axiosInstance.get(`/upkeep/city/${cityId}`);
  return data;
};
