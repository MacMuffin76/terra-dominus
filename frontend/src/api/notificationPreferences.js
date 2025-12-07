import axiosInstance from '../utils/axiosInstance';

export const getNotificationPreferences = async () => {
  const response = await axiosInstance.get('/notifications/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (payload) => {
  const response = await axiosInstance.put('/notifications/preferences', payload);
  return response.data;
};