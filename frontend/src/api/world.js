import axiosInstance from '../utils/axiosInstance';

/**
 * API World - Gestion de la carte du monde et exploration
 */

export const getVisibleWorld = async (bounds = null) => {
  const params = {};
  if (bounds) {
    if (bounds.minX !== undefined) params.minX = bounds.minX;
    if (bounds.minY !== undefined) params.minY = bounds.minY;
    if (bounds.maxX !== undefined) params.maxX = bounds.maxX;
    if (bounds.maxY !== undefined) params.maxY = bounds.maxY;
  }

  const { data } = await axiosInstance.get('/world/visible', { params });
  return data;
};

export const getAvailableCitySlots = async () => {
  const { data } = await axiosInstance.get('/world/city-slots');
  return data;
};

export const getTileInfo = async (x, y) => {
  const { data } = await axiosInstance.get(`/world/tile/${x}/${y}`);
  return data;
};

export const getWorldStats = async () => {
  const { data } = await axiosInstance.get('/world/stats');
  return data;
};

/**
 * API Colonization - Gestion des missions de colonisation
 */

export const startColonization = async (departureCityId, targetSlotId) => {
  const { data } = await axiosInstance.post('/colonization/start', {
    departureCityId,
    targetSlotId,
  });
  return data;
};

export const getUserColonizationMissions = async (statusFilter = null) => {
  const params = statusFilter ? { status: statusFilter } : {};
  const { data } = await axiosInstance.get('/colonization/missions', { params });
  return data;
};

export const cancelColonizationMission = async (missionId) => {
  const { data } = await axiosInstance.delete(`/colonization/missions/${missionId}`);
  return data;
};

export const getMaxCitiesLimit = async () => {
  const { data } = await axiosInstance.get('/colonization/max-cities');
  return data;
};

/**
 * API Cities - Gestion multi-villes
 */

export const getUserCities = async () => {
  const { data } = await axiosInstance.get('/cities/my-cities');
  return data;
};

export const getCityDetails = async (cityId) => {
  const { data } = await axiosInstance.get(`/cities/${cityId}`);
  return data;
};

export const setCapitalCity = async (cityId) => {
  const { data } = await axiosInstance.post(`/cities/${cityId}/set-capital`);
  return data;
};

export const renameCity = async (cityId, newName) => {
  const { data } = await axiosInstance.put(`/cities/${cityId}/rename`, { name: newName });
  return data;
};
