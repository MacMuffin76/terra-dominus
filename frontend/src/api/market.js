// frontend/src/api/market.js
import axiosInstance from '../utils/axiosInstance';

/**
 * Create a market order
 */
export const createOrder = async (cityId, orderType, resourceType, quantity, pricePerUnit, durationHours = null) => {
  const response = await axiosInstance.post('/market/orders', {
    cityId,
    orderType,
    resourceType,
    quantity,
    pricePerUnit,
    durationHours
  });
  return response.data;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId) => {
  const response = await axiosInstance.delete(`/market/orders/${orderId}`);
  return response.data;
};

/**
 * Execute a transaction (buy/sell from an order)
 */
export const executeTransaction = async (orderId, cityId, quantity) => {
  const response = await axiosInstance.post(`/market/orders/${orderId}/execute`, {
    cityId,
    quantity
  });
  return response.data;
};

/**
 * Get active orders on the market
 */
export const getActiveOrders = async (resourceType = null, orderType = null) => {
  const params = {};
  if (resourceType) params.resourceType = resourceType;
  if (orderType) params.orderType = orderType;

  const response = await axiosInstance.get('/market/orders', { params });
  return response.data;
};

/**
 * Get user's orders
 */
export const getUserOrders = async (status = null) => {
  const params = {};
  if (status) params.status = status;

  const response = await axiosInstance.get('/market/my/orders', { params });
  return response.data;
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (limit = 50) => {
  const response = await axiosInstance.get('/market/my/transactions', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get market statistics
 */
export const getMarketStats = async (resourceType) => {
  const response = await axiosInstance.get(`/market/stats/${resourceType}`);
  return response.data;
};
