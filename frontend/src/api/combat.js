import axiosInstance from '../utils/axiosInstance';

/**
 * API client pour le combat (attaques + espionnage)
 */

// ===== ATTAQUES =====

export const launchAttack = async (attackData) => {
  const response = await axiosInstance.post('/combat/attack', attackData);
  return response.data;
};

export const getUserAttacks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/combat/attacks?${params}`);
  return response.data;
};

export const cancelAttack = async (attackId) => {
  const response = await axiosInstance.post(`/combat/attack/${attackId}/cancel`);
  return response.data;
};

export const getCombatReport = async (attackId) => {
  const response = await axiosInstance.get(`/combat/report/${attackId}`);
  return response.data;
};

// ===== ESPIONNAGE =====

export const launchSpyMission = async (missionData) => {
  const response = await axiosInstance.post('/combat/spy', missionData);
  return response.data;
};

export const getUserSpyMissions = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/combat/spy-missions?${params}`);
  return response.data;
};
