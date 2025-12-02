import axiosInstance from '../utils/axiosInstance';

/**
 * API client pour le commerce inter-villes
 */

// ===== ROUTES COMMERCIALES =====

export const establishTradeRoute = async (routeData) => {
  const response = await axiosInstance.post('/trade/routes', routeData);
  return response.data;
};

export const getUserTradeRoutes = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/trade/routes?${params}`);
  return response.data;
};

export const updateTradeRoute = async (routeId, updateData) => {
  const response = await axiosInstance.put(`/trade/routes/${routeId}`, updateData);
  return response.data;
};

export const deleteTradeRoute = async (routeId) => {
  const response = await axiosInstance.delete(`/trade/routes/${routeId}`);
  return response.data;
};

// ===== CONVOIS =====

export const sendConvoy = async (convoyData) => {
  const response = await axiosInstance.post('/trade/convoys', convoyData);
  return response.data;
};

export const getRouteConvoys = async (routeId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axiosInstance.get(`/trade/routes/${routeId}/convoys?${params}`);
  return response.data;
};
