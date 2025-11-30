import axiosInstance from '../utils/axiosInstance';

/**
 * API client pour les leaderboards
 */

/**
 * Récupère un leaderboard par catégorie
 * @param {string} category - Catégorie du leaderboard
 * @param {number} limit - Nombre d'entrées (défaut: 100)
 * @param {number} offset - Offset pour pagination (défaut: 0)
 * @returns {Promise<Object>} Leaderboard data
 */
export const getLeaderboard = async (category, limit = 100, offset = 0) => {
  try {
    const response = await axiosInstance.get(`/leaderboards/${category}`, {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching leaderboard for ${category}:`, error);
    throw error;
  }
};

/**
 * Récupère la position de l'utilisateur dans un leaderboard
 * @param {string} category - Catégorie du leaderboard
 * @returns {Promise<Object>} Position de l'utilisateur
 */
export const getMyPosition = async (category) => {
  try {
    const response = await axiosInstance.get(`/leaderboards/${category}/me`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user position for ${category}:`, error);
    throw error;
  }
};

/**
 * Récupère toutes les positions de l'utilisateur
 * @returns {Promise<Object>} Toutes les positions
 */
export const getAllMyPositions = async () => {
  try {
    const response = await axiosInstance.get('/leaderboards/me/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching all user positions:', error);
    throw error;
  }
};

/**
 * Récupère les récompenses disponibles pour l'utilisateur
 * @param {string} category - Catégorie du leaderboard
 * @param {number|null} seasonId - ID de la saison (optionnel)
 * @returns {Promise<Object>} Récompenses disponibles et réclamées
 */
export const getMyRewards = async (category, seasonId = null) => {
  try {
    const params = seasonId ? { season_id: seasonId } : {};
    const response = await axiosInstance.get(`/leaderboards/${category}/rewards`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching rewards for ${category}:`, error);
    throw error;
  }
};

/**
 * Réclame une récompense de leaderboard
 * @param {number} rewardId - ID de la récompense
 * @returns {Promise<Object>} Résultat de la réclamation
 */
export const claimReward = async (rewardId) => {
  try {
    const response = await axiosInstance.post(`/leaderboards/rewards/${rewardId}/claim`);
    return response.data;
  } catch (error) {
    console.error(`Error claiming reward ${rewardId}:`, error);
    throw error;
  }
};

/**
 * Catégories de leaderboard disponibles
 */
export const LEADERBOARD_CATEGORIES = {
  TOTAL_POWER: 'total_power',
  ECONOMY: 'economy',
  COMBAT_VICTORIES: 'combat_victories',
  BUILDINGS: 'buildings',
  RESEARCH: 'research',
  RESOURCES: 'resources',
  PORTALS: 'portals',
  ACHIEVEMENTS: 'achievements',
  BATTLE_PASS: 'battle_pass'
};

/**
 * Labels français pour les catégories
 */
export const CATEGORY_LABELS = {
  total_power: 'Puissance Totale',
  economy: 'Économie',
  combat_victories: 'Victoires en Combat',
  buildings: 'Bâtiments',
  research: 'Recherche',
  resources: 'Ressources',
  portals: 'Portails',
  achievements: 'Succès',
  battle_pass: 'Battle Pass'
};

/**
 * Icônes pour les catégories
 */
export const CATEGORY_ICONS = {
  total_power: '⚔️',
  economy: '💰',
  combat_victories: '🏆',
  buildings: '🏛️',
  research: '🔬',
  resources: '📦',
  portals: '🌀',
  achievements: '🎯',
  battle_pass: '🎮'
};
