import axios from 'axios';
import { notifyApiError } from './apiErrorHandler';
import { safeStorage } from './safeStorage';

const apiBaseURL = process.env.REACT_APP_API_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = notifyApiError(error);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;