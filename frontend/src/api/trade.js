import axiosInstance from '../utils/axiosInstance';

/**
 * API client pour le commerce inter-villes
 */

// ===== ROUTES COMMERCIALES =====

export const establishTradeRoute = async (routeData) => {
  const response = await axiosInstance.post('/api/v1/trade/routes', routeData);
  return response.data;
};

export const getUserTradeRoutes = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/api/v1/trade/routes?${params}`);
  return response.data;
};

export const updateTradeRoute = async (routeId, updateData) => {
  const response = await axiosInstance.put(`/api/v1/trade/routes/${routeId}`, updateData);
  return response.data;
};

export const deleteTradeRoute = async (routeId) => {
  const response = await axiosInstance.delete(`/api/v1/trade/routes/${routeId}`);
  return response.data;
};

// ===== CONVOIS =====

export const sendConvoy = async (convoyData) => {
  const response = await axiosInstance.post('/api/v1/trade/convoys', convoyData);
  return response.data;
};

export const getRouteConvoys = async (routeId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/api/v1/trade/routes/${routeId}/convoys?${params}`);
  return response.data;
};
