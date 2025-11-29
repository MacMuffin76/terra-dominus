// frontend/src/api/city.js
import axiosInstance from '../utils/axiosInstance';

/**
 * Get all cities for current user
 */
export const getUserCities = async () => {
  const response = await axiosInstance.get('/cities');
  return response.data;
};

/**
 * Get specific city details
 */
export const getCityDetails = async (cityId) => {
  const response = await axiosInstance.get(`/cities/${cityId}`);
  return response.data;
};

/**
 * Set city specialization
 */
export const setSpecialization = async (cityId, specialization) => {
  const response = await axiosInstance.put(`/cities/${cityId}/specialization`, {
    specialization
  });
  return response.data;
};

/**
 * Get available specialization types
 */
export const getSpecializationTypes = async () => {
  const response = await axiosInstance.get('/cities/specializations');
  return response.data;
};
