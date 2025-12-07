import axiosInstance from '../utils/axiosInstance';

export const fetchBattleReports = async ({ page = 1, limit = 10 } = {}) => {
  const response = await axiosInstance.get('/combat/battle-reports', {
    params: { page, limit },
  });
  return response.data;
};