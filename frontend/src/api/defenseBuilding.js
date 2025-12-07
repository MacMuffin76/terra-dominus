import axiosInstance from '../utils/axiosInstance';

/**
 * Build defenses
 * @param {string} defenseId - Defense ID to build
 * @param {number} quantity - Number of defenses to build
 * @returns {Promise<Object>} - Building result
 */
export const buildDefense = async (defenseId, quantity) => {
  try {
    const response = await axiosInstance.post('/defenses/build', {
      defenseId,
      quantity
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Erreur lors de la construction');
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erreur réseau lors de la construction des défenses');
  }
};

/**
 * Get all built defenses for the current player
 * @returns {Promise<Array>} - Array of built defenses
 */
export const getPlayerDefenses = async () => {
  try {
    const response = await axiosInstance.get('/defenses/player');

    if (response.data.success) {
      return response.data.defenses || [];
    } else {
      throw new Error(response.data.message || 'Erreur lors de la récupération des défenses');
    }
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erreur réseau lors de la récupération des défenses');
  }
};
