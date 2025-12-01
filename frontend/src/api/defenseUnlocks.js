// frontend/src/api/defenseUnlocks.js

import axiosInstance from '../utils/axiosInstance';

/**
 * Get available defenses (unlocked + locked) for current user
 * @returns {Promise<{unlocked: Array, locked: Array, nextUnlock: Object, buildings: Object, tierProgress: Object}>}
 */
export const getAvailableDefenses = async () => {
  const { data } = await axiosInstance.get('/defense/unlock/available');
  return data;
};

/**
 * Check if specific defense is unlocked
 * @param {string} defenseId - Defense identifier (e.g., 'machine_gun_turret', 'plasma_turret')
 * @returns {Promise<{isUnlocked: boolean, reason?: string, missingRequirements?: Array}>}
 */
export const checkDefenseUnlock = async (defenseId) => {
  const { data } = await axiosInstance.get(`/defense/unlock/check/${defenseId}`);
  return data;
};

/**
 * Get all defense tiers summary with progression
 * @returns {Promise<Array<{tier: number, name: string, requiredLevel: number, isUnlocked: boolean, defenses: Array}>>}
 */
export const getDefenseTiersSummary = async () => {
  const { data } = await axiosInstance.get('/defense/unlock/tiers');
  return data;
};
