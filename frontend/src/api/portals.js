/**
 * Portal API - New System
 * Gestion des portails PvE avec nouveau backend
 */

import axiosInstance from '../utils/axiosInstance';

const API_BASE = '/portals';

/**
 * Get all active portals with optional filters
 * @param {Object} filters - { tier, minDifficulty, maxDifficulty }
 */
export const getActivePortals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tier) params.append('tier', filters.tier);
  if (filters.minDifficulty) params.append('minDifficulty', filters.minDifficulty);
  if (filters.maxDifficulty) params.append('maxDifficulty', filters.maxDifficulty);
  
  const url = params.toString() ? `${API_BASE}?${params.toString()}` : API_BASE;
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get portal details by ID
 */
export const getPortalById = async (portalId) => {
  const response = await axiosInstance.get(`${API_BASE}/${portalId}`);
  return response.data;
};

/**
 * Attack a portal with units
 * @param {number} portalId 
 * @param {Object} units - { Infantry: 50, Tank: 10 }
 * @param {string} tactic - 'balanced' | 'aggressive' | 'defensive'
 */
export const attackPortal = async (portalId, units, tactic = 'balanced') => {
  const response = await axiosInstance.post(`${API_BASE}/${portalId}/attack`, {
    units,
    tactic
  });
  return response.data;
};

/**
 * Get battle estimation without actually attacking
 * @param {number} portalId 
 * @param {Object} units 
 */
export const estimateBattle = async (portalId, units) => {
  const response = await axiosInstance.post(`${API_BASE}/${portalId}/estimate`, {
    units
  });
  return response.data;
};

/**
 * Get user's mastery progression for all tiers
 */
export const getUserMastery = async () => {
  const response = await axiosInstance.get(`${API_BASE}/mastery`);
  return response.data;
};

/**
 * Get user's battle history
 * @param {number} limit 
 * @param {number} offset 
 */
export const getBattleHistory = async (limit = 50, offset = 0) => {
  const response = await axiosInstance.get(`${API_BASE}/history?limit=${limit}&offset=${offset}`);
  return response.data;
};

/**
 * Get leaderboard for a specific tier
 * @param {string} tier - 'grey' | 'green' | 'blue' | 'purple' | 'red' | 'golden'
 * @param {number} limit 
 */
export const getLeaderboard = async (tier, limit = 100) => {
  const response = await axiosInstance.get(`${API_BASE}/leaderboard/${tier}?limit=${limit}`);
  return response.data;
};

/**
 * Get golden portal world events
 */
export const getGoldenPortalEvents = async () => {
  const response = await axiosInstance.get(`${API_BASE}/events`);
  return response.data;
};

/**
 * [ADMIN] Manually spawn a portal
 */
export const spawnPortal = async (tier, x_coordinate, y_coordinate) => {
  const response = await axiosInstance.post(`${API_BASE}/spawn`, {
    tier,
    x_coordinate,
    y_coordinate
  });
  return response.data;
};

/**
 * [ADMIN] Get spawning statistics
 */
export const getSpawningStats = async () => {
  const response = await axiosInstance.get(`${API_BASE}/stats/spawning`);
  return response.data;
};

// ========================================
// BOSS BATTLES API
// ========================================

/**
 * Get all active bosses
 * @param {Object} filters - { tier, boss_type }
 */
export const getActiveBosses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tier) params.append('tier', filters.tier);
  if (filters.boss_type) params.append('boss_type', filters.boss_type);
  
  const url = params.toString() ? `${API_BASE}/bosses?${params.toString()}` : `${API_BASE}/bosses`;
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get boss details
 * @param {number} bossId 
 */
export const getBossDetails = async (bossId) => {
  const response = await axiosInstance.get(`${API_BASE}/bosses/${bossId}`);
  return response.data;
};

/**
 * Get boss attempts history
 * @param {number} bossId 
 * @param {number} limit 
 */
export const getBossAttempts = async (bossId, limit = 20) => {
  const response = await axiosInstance.get(`${API_BASE}/bosses/${bossId}/attempts?limit=${limit}`);
  return response.data;
};

/**
 * Get boss leaderboard
 * @param {number} bossId 
 * @param {number} limit 
 */
export const getBossLeaderboard = async (bossId, limit = 10) => {
  const response = await axiosInstance.get(`${API_BASE}/bosses/${bossId}/leaderboard?limit=${limit}`);
  return response.data;
};

/**
 * Attack a boss
 * @param {number} bossId 
 * @param {Object} units - { Infantry: 50, Tank: 10 }
 * @param {string} tactic - 'balanced' | 'aggressive' | 'defensive'
 */
export const attackBoss = async (bossId, units, tactic = 'balanced') => {
  const response = await axiosInstance.post(`${API_BASE}/bosses/${bossId}/attack`, {
    units,
    tactic
  });
  return response.data;
};

/**
 * Estimate boss battle
 * @param {number} bossId 
 * @param {Object} units 
 */
export const estimateBossBattle = async (bossId, units) => {
  const response = await axiosInstance.post(`${API_BASE}/bosses/${bossId}/estimate`, {
    units
  });
  return response.data;
};

/**
 * Get user's boss attempts
 * @param {number} limit 
 */
export const getUserBossAttempts = async (limit = 10) => {
  const response = await axiosInstance.get(`${API_BASE}/user/boss-attempts?limit=${limit}`);
  return response.data;
};

// ========================================
// ALLIANCE RAIDS API
// ========================================

/**
 * Get alliance raids
 * @param {number} allianceId 
 * @param {string} status - 'active' | 'completed'
 */
export const getAllianceRaids = async (allianceId, status = 'active') => {
  const response = await axiosInstance.get(`${API_BASE}/raids?alliance_id=${allianceId}&status=${status}`);
  return response.data;
};

/**
 * Get raid details
 * @param {number} raidId 
 */
export const getRaidDetails = async (raidId) => {
  const response = await axiosInstance.get(`${API_BASE}/raids/${raidId}`);
  return response.data;
};

/**
 * Create alliance raid
 * @param {number} bossId 
 * @param {number} allianceId 
 * @param {number} minParticipants 
 * @param {number} maxParticipants 
 */
export const createRaid = async (bossId, allianceId, minParticipants = 3, maxParticipants = 10) => {
  const response = await axiosInstance.post(`${API_BASE}/raids/create`, {
    boss_id: bossId,
    alliance_id: allianceId,
    min_participants: minParticipants,
    max_participants: maxParticipants
  });
  return response.data;
};

/**
 * Join alliance raid
 * @param {number} raidId 
 * @param {Object} units 
 */
export const joinRaid = async (raidId, units) => {
  const response = await axiosInstance.post(`${API_BASE}/raids/${raidId}/join`, {
    units
  });
  return response.data;
};

/**
 * Start alliance raid
 * @param {number} raidId 
 */
export const startRaid = async (raidId) => {
  const response = await axiosInstance.post(`${API_BASE}/raids/${raidId}/start`);
  return response.data;
};

/**
 * Get raid participants
 * @param {number} raidId 
 */
export const getRaidParticipants = async (raidId) => {
  const response = await axiosInstance.get(`${API_BASE}/raids/${raidId}/participants`);
  return response.data;
};

// Legacy API compatibility (kept for existing components)
export const getPortalsNear = async (coordX, coordY, radius = 100) => {
  // Use new API with coordinates filter (if needed, implement backend support)
  return getActivePortals();
};

export const challengePortal = async (portalId, cityId, units) => {
  // Wrapper for old API - convert to new format
  return attackPortal(portalId, units, 'balanced');
};

export const getUserExpeditions = async (status = null) => {
  // Use new battle history API
  return getBattleHistory();
};

export const getPortalStatistics = async () => {
  // Use new mastery API
  return getUserMastery();
};
