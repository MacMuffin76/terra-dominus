import axiosInstance from '../utils/axiosInstance';

/**
 * Train units (recruit new soldiers)
 * @param {string} unitId - Unit ID to train
 * @param {number} quantity - Number of units to train
 * @returns {Promise<Object>} - Training result
 */
export const trainUnits = async (unitId, quantity) => {
  try {
    const response = await axiosInstance.post('/units/train', {
      unitId,
      quantity
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Erreur lors de l\'entraînement');
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erreur réseau lors de l\'entraînement des unités');
  }
};

/**
 * Get all trained units for the current player
 * @returns {Promise<Array>} - Array of trained units
 */
export const getPlayerUnits = async () => {
  try {
    const response = await axiosInstance.get('/units/player');

    if (response.data.success) {
      return response.data.units || [];
    } else {
      throw new Error(response.data.message || 'Erreur lors de la récupération des unités');
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erreur réseau lors de la récupération des unités');
  }
};
