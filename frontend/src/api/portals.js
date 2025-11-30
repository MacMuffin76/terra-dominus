/**
 * Portal API
 * Gestion des portails PvE
 */

import axiosInstance from '../utils/axiosInstance';

const API_BASE = '/portals';

/**
 * Get all active portals
 */
export const getActivePortals = async () => {
  const response = await axiosInstance.get(API_BASE);
  return response.data;
};

/**
 * Get portals near specific coordinates
 */
export const getPortalsNear = async (coordX, coordY, radius = 100) => {
  const response = await axiosInstance.get(`${API_BASE}/near/${coordX}/${coordY}?radius=${radius}`);
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
 * Challenge a portal with units
 */
export const challengePortal = async (portalId, cityId, units) => {
  const response = await axiosInstance.post(`${API_BASE}/${portalId}/challenge`, {
    cityId,
    units
  });
  return response.data;
};

/**
 * Get user's portal expeditions
 */
export const getUserExpeditions = async (status = null) => {
  const url = status ? `${API_BASE}/expeditions?status=${status}` : `${API_BASE}/expeditions`;
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Get portal statistics
 */
export const getPortalStatistics = async () => {
  const response = await axiosInstance.get(`${API_BASE}/statistics`);
  return response.data;
};
