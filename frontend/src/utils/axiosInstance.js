import axios from 'axios';

const apiBaseURL = process.env.REACT_APP_API_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
