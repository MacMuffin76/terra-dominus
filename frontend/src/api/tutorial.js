import axios from '../utils/axiosInstance';

/**
 * Get tutorial progress for current user
 */
export const getTutorialProgress = async () => {
  const response = await axios.get('/tutorial/progress');
  return response.data;
};

/**
 * Complete a tutorial step
 */
export const completeStep = async (stepId, actionData = {}) => {
  const response = await axios.post('/tutorial/complete-step', {
    stepId,
    actionData,
  });
  return response.data;
};

/**
 * Skip tutorial
 */
export const skipTutorial = async () => {
  const response = await axios.post('/tutorial/skip');
  return response.data;
};

/**
 * Reset tutorial (for replay)
 */
export const resetTutorial = async () => {
  const response = await axios.post('/tutorial/reset');
  return response.data;
};

/**
 * Get tutorial statistics (admin)
 */
export const getTutorialStatistics = async () => {
  const response = await axios.get('/tutorial/statistics');
  return response.data;
};
